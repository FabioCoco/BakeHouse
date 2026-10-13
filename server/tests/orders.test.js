import request from 'supertest';
import app from '../src/app.js';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import {
  createAdmin,
  createCategory,
  createProduct,
  createUser,
  loginCookie,
  testAddress,
} from './helpers/factories.js';

beforeAll(startTestDb);
afterAll(stopTestDb);

let category;
let customer;
let customerCookie;
let admin;
let adminCookie;

beforeEach(async () => {
  await clearTestDb();
  category = await createCategory('French Pastry');
  customer = await createUser({ email: 'buyer@example.com' });
  customerCookie = await loginCookie(request(app), customer.email);
  admin = await createAdmin();
  adminCookie = await loginCookie(request(app), admin.email);
});

const addToCart = (product, quantity, cookie = customerCookie) =>
  request(app)
    .post('/api/cart/items')
    .set('Cookie', cookie)
    .send({ productId: String(product._id), quantity });

const checkout = (body = {}, cookie = customerCookie) =>
  request(app)
    .post('/api/orders/checkout')
    .set('Cookie', cookie)
    .send({ address: testAddress, paymentNote: 'BCA transfer ref 123', ...body });

const setStatus = (orderId, status) =>
  request(app).patch(`/api/admin/orders/${orderId}/status`).set('Cookie', adminCookie).send({ status });

const stockOf = async (product) => (await Product.findById(product._id)).stock;

describe('cart', () => {
  it('rejects adding more than the available stock', async () => {
    const product = await createProduct(category, { stock: 3 });

    const res = await addToCart(product, 4);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Only 3/);
  });

  it('computes the subtotal on the server and flags lines whose stock dropped', async () => {
    const product = await createProduct(category, { price: 22000, stock: 5 });
    await addToCart(product, 3);
    await Product.updateOne({ _id: product._id }, { stock: 1 });

    const res = await request(app).get('/api/cart').set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.subtotal).toBe(66000);
    expect(res.body.data.hasIssues).toBe(true);
    expect(res.body.data.items[0].issues).toEqual(['insufficient_stock']);
  });
});

describe('POST /api/orders/checkout', () => {
  it('prices from the database, decrements stock, clears the cart and returns bank details', async () => {
    const croissant = await createProduct(category, { name: 'Croissant', price: 22000, stock: 10 });
    const bread = await createProduct(category, { name: 'Shokupan', price: 65000, stock: 5 });
    await addToCart(croissant, 2);
    await addToCart(bread, 1);

    // A client-supplied price must be ignored.
    const res = await checkout({ items: [{ product: String(bread._id), price: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.data.order.subtotal).toBe(109000);
    expect(res.body.data.order.shippingFee).toBe(15000);
    expect(res.body.data.order.total).toBe(124000);
    expect(res.body.data.order.status).toBe('pending_confirmation');
    expect(res.body.data.payment).toMatchObject({ bankName: 'BCA', accountNumber: '1234567890' });

    expect(await stockOf(croissant)).toBe(8);
    expect(await stockOf(bread)).toBe(4);

    const cart = await request(app).get('/api/cart').set('Cookie', customerCookie);
    expect(cart.body.data.items).toHaveLength(0);
  });

  it('charges no shipping fee at or above the free-shipping threshold', async () => {
    const cake = await createProduct(category, { price: 300000, stock: 2 });
    await addToCart(cake, 1);

    const res = await checkout();

    expect(res.body.data.order.shippingFee).toBe(0);
    expect(res.body.data.order.total).toBe(300000);
  });

  it('rolls back every stock change and keeps the cart when one item is out of stock', async () => {
    const croissant = await createProduct(category, { name: 'Croissant', price: 22000, stock: 10 });
    const bread = await createProduct(category, { name: 'Shokupan', price: 65000, stock: 5 });
    await addToCart(croissant, 2);
    await addToCart(bread, 1);

    // Simulate another customer buying the last bread after it was added to this cart.
    await Product.updateOne({ _id: bread._id }, { stock: 0 });

    const res = await checkout();

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Shokupan/);
    expect(res.body.errors[0]).toMatchObject({ name: 'Shokupan', available: 0 });

    expect(await stockOf(croissant)).toBe(10);
    expect(await Order.countDocuments({})).toBe(0);

    const cart = await request(app).get('/api/cart').set('Cookie', customerCookie);
    expect(cart.body.data.items).toHaveLength(2);
  });
});

describe('order ownership', () => {
  it('returns 404 when a customer requests someone else\'s order', async () => {
    const product = await createProduct(category, { stock: 5 });
    await addToCart(product, 1);
    const created = await checkout();
    const orderId = created.body.data.order._id;

    const other = await createUser({ email: 'other@example.com' });
    const otherCookie = await loginCookie(request(app), other.email);

    const res = await request(app).get(`/api/orders/me/${orderId}`).set('Cookie', otherCookie);
    expect(res.status).toBe(404);
  });
});

describe('order status transitions', () => {
  const placeOrder = async () => {
    const product = await createProduct(category, { price: 22000, stock: 10 });
    await addToCart(product, 2);
    const res = await checkout();
    return { orderId: res.body.data.order._id, product };
  };

  it('follows the allowed flow and records each change in statusHistory', async () => {
    const { orderId } = await placeOrder();

    expect((await setStatus(orderId, 'processing')).status).toBe(200);
    expect((await setStatus(orderId, 'shipped')).status).toBe(200);
    const done = await setStatus(orderId, 'completed');

    expect(done.status).toBe(200);
    expect(done.body.data.statusHistory.map((h) => h.status)).toEqual([
      'pending_confirmation',
      'processing',
      'shipped',
      'completed',
    ]);
  });

  it('rejects skipping a step with 400', async () => {
    const { orderId } = await placeOrder();

    const res = await setStatus(orderId, 'shipped');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cannot change order status/);
  });

  it('rejects leaving a terminal status', async () => {
    const { orderId } = await placeOrder();
    await setStatus(orderId, 'processing');
    await setStatus(orderId, 'shipped');
    await setStatus(orderId, 'completed');

    const res = await setStatus(orderId, 'cancelled');

    expect(res.status).toBe(400);
  });

  it('restores stock when an admin cancels an order', async () => {
    const { orderId, product } = await placeOrder();
    expect(await stockOf(product)).toBe(8);

    const res = await setStatus(orderId, 'cancelled');

    expect(res.status).toBe(200);
    expect(await stockOf(product)).toBe(10);
  });

  it('lets a customer cancel while pending and restores stock', async () => {
    const { orderId, product } = await placeOrder();

    const res = await request(app).patch(`/api/orders/me/${orderId}/cancel`).set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(await stockOf(product)).toBe(10);
  });

  it('blocks a customer from cancelling once processing has started', async () => {
    const { orderId } = await placeOrder();
    await setStatus(orderId, 'processing');

    const res = await request(app).patch(`/api/orders/me/${orderId}/cancel`).set('Cookie', customerCookie);

    expect(res.status).toBe(400);
    expect((await Order.findById(orderId)).status).toBe('processing');
  });
});
