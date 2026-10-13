import './helpers/midtrans.js';
import request from 'supertest';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { effectivePriceOf, isSaleActive } from '../src/utils/pricing.js';
import { midtrans, resetMidtrans } from './helpers/midtrans.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
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

const DAY = 24 * 60 * 60 * 1000;
const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

let category;
let customerCookie;
let adminCookie;

beforeEach(async () => {
  await clearTestDb();
  resetMidtrans();
  category = await createCategory('Promo Category');
  const customer = await createUser({ email: 'promo-buyer@example.com' });
  customerCookie = await loginCookie(request(app), customer.email);
  const admin = await createAdmin();
  adminCookie = await loginCookie(request(app), admin.email);
});

describe('pricing rules', () => {
  const base = { price: 10000 };

  it('applies a discount that has no dates', () => {
    expect(effectivePriceOf({ ...base, discountPercent: 20 })).toBe(8000);
    expect(isSaleActive({ ...base, discountPercent: 20 })).toBe(true);
  });

  it('ignores a discount whose start is still in the future', () => {
    const product = { ...base, discountPercent: 20, discountStartsAt: new Date(Date.now() + DAY) };
    expect(isSaleActive(product)).toBe(false);
    expect(effectivePriceOf(product)).toBe(10000);
  });

  it('ignores a discount that has already ended', () => {
    const product = { ...base, discountPercent: 20, discountEndsAt: new Date(Date.now() - DAY) };
    expect(effectivePriceOf(product)).toBe(10000);
  });

  it('rounds to a whole rupiah', () => {
    expect(effectivePriceOf({ price: 12345, discountPercent: 15 })).toBe(10493);
  });
});

describe('product discount fields', () => {
  it('returns effectivePrice and isOnSale from the server clock', async () => {
    const product = await createProduct(category, { name: 'Sale Bun', price: 20000, discountPercent: 25 });

    const res = await request(app).get(`/api/products/${product.slug}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ price: 20000, discountPercent: 25, effectivePrice: 15000, isOnSale: true });
  });

  it('reports no sale once the discount end time has passed', async () => {
    const product = await createProduct(category, {
      name: 'Old Promo',
      price: 20000,
      discountPercent: 25,
      discountEndsAt: new Date(Date.now() - DAY),
    });

    const res = await request(app).get(`/api/products/${product.slug}`);

    expect(res.body.data).toMatchObject({ effectivePrice: 20000, isOnSale: false });
  });

  it('filters onSale=true and sorts by the biggest discount', async () => {
    await createProduct(category, { name: 'Small Promo', discountPercent: 10 });
    await createProduct(category, { name: 'Big Promo', discountPercent: 40 });
    await createProduct(category, { name: 'Full Price', discountPercent: 0 });
    await createProduct(category, {
      name: 'Future Promo',
      discountPercent: 60,
      discountStartsAt: hoursFromNow(48),
    });

    const res = await request(app).get('/api/products?onSale=true&sort=discount');

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.name)).toEqual(['Big Promo', 'Small Promo']);
    expect(res.body.meta.total).toBe(2);
  });
});

describe('admin discount validation', () => {
  it('rejects an end date that is not after the start date', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({
        name: 'Bad Dates',
        description: 'Desc',
        price: 10000,
        category: String(category._id),
        discountPercent: 10,
        discountStartsAt: hoursFromNow(24).toISOString(),
        discountEndsAt: hoursFromNow(2).toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('discountEndsAt');
  });

  it('rejects a discount above 90 percent', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({ name: 'Too Much', description: 'Desc', price: 10000, category: String(category._id), discountPercent: 91 });

    expect(res.status).toBe(400);
  });

  it('checks the stored start date when only the end date changes', async () => {
    const product = await createProduct(category, { discountStartsAt: hoursFromNow(24) });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Cookie', adminCookie)
      .send({ discountEndsAt: hoursFromNow(2).toISOString() });

    expect(res.status).toBe(400);
    expect((await Product.findById(product._id)).discountEndsAt).toBeNull();
  });

  it('clears a discount when the admin sends null', async () => {
    const product = await createProduct(category, { discountPercent: 15 });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Cookie', adminCookie)
      .send({ discountPercent: 0, discountStartsAt: null, discountEndsAt: null });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ discountPercent: 0, isOnSale: false });
  });
});

describe('discounted checkout and cart', () => {
  it('charges the discounted price and snapshots the original price on the order item', async () => {
    const product = await createProduct(category, { name: 'Lemon Tart', price: 75000, stock: 5, discountPercent: 20 });
    await request(app).post('/api/cart/items').set('Cookie', customerCookie).send({ productId: String(product._id), quantity: 2 });

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Cookie', customerCookie)
      .send({ address: testAddress });

    expect(res.status).toBe(201);
    const item = res.body.data.order.items[0];
    expect(item).toMatchObject({ price: 60000, originalPrice: 75000, discountPercent: 20, quantity: 2 });
    expect(res.body.data.order.subtotal).toBe(120000);

    // Snap must receive the discounted unit price, and its items must add up to the total.
    const params = midtrans.snapCalls[0];
    expect(params.item_details[0]).toMatchObject({ price: 60000, quantity: 2 });
    expect(params.item_details.reduce((sum, i) => sum + i.price * i.quantity, 0)).toBe(params.transaction_details.gross_amount);
  });

  it('ignores a discount that has ended before checkout', async () => {
    const product = await createProduct(category, {
      name: 'Expired Promo',
      price: 50000,
      stock: 5,
      discountPercent: 30,
      discountEndsAt: new Date(Date.now() - DAY),
    });
    await request(app).post('/api/cart/items').set('Cookie', customerCookie).send({ productId: String(product._id), quantity: 1 });

    const res = await request(app).post('/api/orders/checkout').set('Cookie', customerCookie).send({ address: testAddress });

    expect(res.body.data.order.items[0]).toMatchObject({ price: 50000, discountPercent: 0 });
  });

  it('shows the discounted line total in the cart', async () => {
    const product = await createProduct(category, { price: 10000, stock: 5, discountPercent: 50 });
    await request(app).post('/api/cart/items').set('Cookie', customerCookie).send({ productId: String(product._id), quantity: 3 });

    const res = await request(app).get('/api/cart').set('Cookie', customerCookie);

    expect(res.body.data.items[0].lineTotal).toBe(15000);
    expect(res.body.data.subtotal).toBe(15000);
    expect((await Order.countDocuments({}))).toBe(0);
  });
});
