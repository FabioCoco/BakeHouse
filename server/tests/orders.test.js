import request from 'supertest';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { midtrans, notificationFor, resetMidtrans, statusBody } from './helpers/midtrans.js';
import {
  createAdmin,
  createCategory,
  createProduct,
  createUser,
  loginCookie,
  testAddress,
} from './helpers/factories.js';

// The app must load after the midtrans-client mock is registered, so it is imported dynamically.
const { default: app } = await import('../src/app.js');

beforeAll(startTestDb);
afterAll(stopTestDb);

let category;
let customer;
let customerCookie;
let admin;
let adminCookie;

beforeEach(async () => {
  await clearTestDb();
  resetMidtrans();
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
    .send({ address: testAddress, paymentNote: 'Kirim sebelum jam 10', ...body });

const setStatus = (orderId, status) =>
  request(app).patch(`/api/admin/orders/${orderId}/status`).set('Cookie', adminCookie).send({ status });

const stockOf = async (product) => (await Product.findById(product._id)).stock;

// Simulates the Midtrans settlement webhook, so an order can be moved to processing the way it really happens.
const payOrder = async (orderNumber, grossAmount) => {
  midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: grossAmount });
  return request(app)
    .post('/api/payments/midtrans/notification')
    .send(notificationFor({ order_id: orderNumber, gross_amount: String(grossAmount), transaction_status: 'settlement', fraud_status: 'accept' }));
};

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
  it('prices from the database, reserves stock, clears the cart and creates a Snap transaction', async () => {
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
    expect(res.body.data.order.status).toBe('pending_payment');
    expect(res.body.data.order.paymentStatus).toBe('unpaid');
    expect(res.body.data.snapToken).toBe(`snap-token-${res.body.data.order.orderNumber}`);
    expect(res.body.data.clientKey).toBe('SB-Mid-client-test-key');

    // Snap items must add up to gross_amount exactly, so the shipping fee is its own line.
    const params = midtrans.snapCalls[0];
    expect(params.transaction_details).toEqual({ order_id: res.body.data.order.orderNumber, gross_amount: 124000 });
    expect(params.item_details.reduce((sum, i) => sum + i.price * i.quantity, 0)).toBe(124000);
    expect(params.item_details.at(-1)).toMatchObject({ name: 'Ongkos Kirim', price: 15000 });
    expect(params.expiry).toEqual({ unit: 'hour', duration: 24 });

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
    expect(midtrans.snapCalls[0].item_details.some((i) => i.name === 'Ongkos Kirim')).toBe(false);
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
    expect(midtrans.snapCalls).toHaveLength(0);

    const cart = await request(app).get('/api/cart').set('Cookie', customerCookie);
    expect(cart.body.data.items).toHaveLength(2);
  });

  it('cancels the order, restores stock and the cart when Midtrans fails', async () => {
    const croissant = await createProduct(category, { price: 22000, stock: 10 });
    await addToCart(croissant, 2);
    midtrans.snapFails = true;

    const res = await checkout();

    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/Pesanan dibatalkan/);
    expect(await stockOf(croissant)).toBe(10);

    const order = await Order.findOne({});
    expect(order.status).toBe('cancelled');
    expect(order.paymentStatus).toBe('failed');

    const cart = await request(app).get('/api/cart').set('Cookie', customerCookie);
    expect(cart.body.data.items).toHaveLength(1);
    expect(cart.body.data.items[0].quantity).toBe(2);
  });
});

describe('POST /api/orders/me/:id/pay', () => {
  it('returns the existing Snap token while the order is unpaid', async () => {
    const product = await createProduct(category, { stock: 5 });
    await addToCart(product, 1);
    const created = await checkout();
    const orderId = created.body.data.order._id;

    const res = await request(app).post(`/api/orders/me/${orderId}/pay`).set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.snapToken).toBe(created.body.data.snapToken);
    expect(midtrans.snapCalls).toHaveLength(1);
  });

  it('refuses once the order has been paid', async () => {
    const product = await createProduct(category, { stock: 5 });
    await addToCart(product, 1);
    const created = await checkout();
    await payOrder(created.body.data.order.orderNumber, created.body.data.order.total);

    const res = await request(app).post(`/api/orders/me/${created.body.data.order._id}/pay`).set('Cookie', customerCookie);

    expect(res.status).toBe(409);
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
    return { orderId: res.body.data.order._id, orderNumber: res.body.data.order.orderNumber, total: res.body.data.order.total, product };
  };

  it('moves through the flow after payment and records each change in statusHistory', async () => {
    const { orderId, orderNumber, total } = await placeOrder();
    expect((await payOrder(orderNumber, total)).status).toBe(200);

    expect((await setStatus(orderId, 'shipped')).status).toBe(200);
    const done = await setStatus(orderId, 'completed');

    expect(done.status).toBe(200);
    expect(done.body.data.statusHistory.map((h) => h.status)).toEqual([
      'pending_payment',
      'processing',
      'shipped',
      'completed',
    ]);
    expect(done.body.data.statusHistory[1].changedBy).toBe('system:midtrans');
  });

  it('does not let an admin move an unpaid order to processing by hand', async () => {
    const { orderId } = await placeOrder();

    const res = await setStatus(orderId, 'processing');

    expect(res.status).toBe(400);
    expect((await Order.findById(orderId)).status).toBe('pending_payment');
  });

  it('rejects skipping a step with 400', async () => {
    const { orderId, orderNumber, total } = await placeOrder();
    await payOrder(orderNumber, total);

    const res = await setStatus(orderId, 'completed');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cannot change order status/);
  });

  it('rejects leaving a terminal status', async () => {
    const { orderId, orderNumber, total } = await placeOrder();
    await payOrder(orderNumber, total);
    await setStatus(orderId, 'shipped');
    await setStatus(orderId, 'completed');

    const res = await setStatus(orderId, 'cancelled');

    expect(res.status).toBe(400);
  });

  it('restores stock when an admin cancels an unpaid order', async () => {
    const { orderId, product } = await placeOrder();
    expect(await stockOf(product)).toBe(8);

    const res = await setStatus(orderId, 'cancelled');

    expect(res.status).toBe(200);
    expect(await stockOf(product)).toBe(10);
  });

  it('marks a paid order as refunded when an admin cancels it', async () => {
    const { orderId, orderNumber, total } = await placeOrder();
    await payOrder(orderNumber, total);

    const res = await setStatus(orderId, 'cancelled');

    expect(res.status).toBe(200);
    expect(res.body.data.paymentStatus).toBe('refunded');
  });

  it('lets a customer cancel while pending payment and restores stock', async () => {
    const { orderId, product } = await placeOrder();

    const res = await request(app).patch(`/api/orders/me/${orderId}/cancel`).set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(await stockOf(product)).toBe(10);
  });

  it('blocks a customer from cancelling once payment has been received', async () => {
    const { orderId, orderNumber, total } = await placeOrder();
    await payOrder(orderNumber, total);

    const res = await request(app).patch(`/api/orders/me/${orderId}/cancel`).set('Cookie', customerCookie);

    expect(res.status).toBe(400);
    expect((await Order.findById(orderId)).status).toBe('processing');
  });
});

describe('POST /api/orders/checkout with buyNow', () => {
  const buyNow = (product, quantity) => ({ productId: String(product._id), quantity });

  it('orders only the chosen product and leaves the cart untouched', async () => {
    const inCart = await createProduct(category, { name: 'Cart Item', price: 10000, stock: 10 });
    const target = await createProduct(category, { name: 'Buy Now Item', price: 40000, stock: 10 });
    await addToCart(inCart, 1);

    const res = await checkout({ buyNow: buyNow(target, 2) });

    expect(res.status).toBe(201);
    expect(res.body.data.order.items).toHaveLength(1);
    expect(res.body.data.order.items[0]).toMatchObject({ name: 'Buy Now Item', quantity: 2, price: 40000 });
    expect(res.body.data.order.source).toBe('buy_now');
    expect(await stockOf(target)).toBe(8);
    expect(await stockOf(inCart)).toBe(10);

    const cart = await request(app).get('/api/cart').set('Cookie', customerCookie);
    expect(cart.body.data.items).toHaveLength(1);
    expect(cart.body.data.items[0].quantity).toBe(1);
  });

  it('uses the discounted price', async () => {
    const target = await createProduct(category, { price: 50000, stock: 5, discountPercent: 10 });

    const res = await checkout({ buyNow: buyNow(target, 1) });

    expect(res.body.data.order.items[0]).toMatchObject({ price: 45000, originalPrice: 50000, discountPercent: 10 });
  });

  it('rejects a quantity above the available stock and creates nothing', async () => {
    const target = await createProduct(category, { price: 20000, stock: 1 });

    const res = await checkout({ buyNow: buyNow(target, 2) });

    expect(res.status).toBe(409);
    expect(await stockOf(target)).toBe(1);
    expect(await Order.countDocuments({})).toBe(0);
  });

  it('rejects an invalid quantity or product id', async () => {
    const target = await createProduct(category, { stock: 5 });

    expect((await checkout({ buyNow: { productId: String(target._id), quantity: 0 } })).status).toBe(400);
    expect((await checkout({ buyNow: { productId: 'not-an-id', quantity: 1 } })).status).toBe(400);
  });

  it('works without any cart at all', async () => {
    const target = await createProduct(category, { price: 20000, stock: 5 });

    const res = await checkout({ buyNow: buyNow(target, 1) });

    expect(res.status).toBe(201);
  });

  it('leaves the cart alone when Midtrans fails for a buy-now order', async () => {
    const inCart = await createProduct(category, { name: 'Keep Me', price: 10000, stock: 10 });
    const target = await createProduct(category, { name: 'Buy Now Fails', price: 20000, stock: 4 });
    await addToCart(inCart, 3);
    midtrans.snapFails = true;

    const res = await checkout({ buyNow: buyNow(target, 1) });

    expect(res.status).toBe(502);
    expect(await stockOf(target)).toBe(4);
    const cart = await request(app).get('/api/cart').set('Cookie', customerCookie);
    expect(cart.body.data.items).toHaveLength(1);
    expect(cart.body.data.items[0].quantity).toBe(3);
  });
});
