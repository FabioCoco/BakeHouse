import request from 'supertest';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { midtrans, notificationFor, resetMidtrans, statusBody } from './helpers/midtrans.js';
import { createCategory, createProduct, createUser, loginCookie, testAddress } from './helpers/factories.js';

// The app must load after the midtrans-client mock is registered, so it is imported dynamically.
const { default: app } = await import('../src/app.js');

beforeAll(startTestDb);
afterAll(stopTestDb);

const NOTIFY = '/api/payments/midtrans/notification';

let category;
let customerCookie;

beforeEach(async () => {
  await clearTestDb();
  resetMidtrans();
  category = await createCategory('French Pastry');
  const customer = await createUser({ email: 'payer@example.com' });
  customerCookie = await loginCookie(request(app), customer.email);
});

// Places an order through the real checkout, and returns the order plus the product used.
const placeOrder = async (quantity = 2) => {
  const product = await createProduct(category, { price: 22000, stock: 10 });
  await request(app).post('/api/cart/items').set('Cookie', customerCookie).send({ productId: String(product._id), quantity });
  const res = await request(app)
    .post('/api/orders/checkout')
    .set('Cookie', customerCookie)
    .send({ address: testAddress });
  return { order: res.body.data.order, product };
};

// Sends a notification signed with the server key, the way Midtrans does.
const notify = (order, transaction_status, extra = {}) =>
  request(app)
    .post(NOTIFY)
    .send(
      notificationFor({
        order_id: order.orderNumber,
        gross_amount: `${order.total}.00`,
        transaction_status,
        fraud_status: 'accept',
        ...extra,
      }),
    );

const stockOf = async (product) => (await Product.findById(product._id)).stock;

describe('POST /api/payments/midtrans/notification signature', () => {
  it('accepts a correctly signed notification and checks the status with Midtrans', async () => {
    const { order } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: order.total });

    const res = await notify(order, 'settlement');

    expect(res.status).toBe(200);
    // The status is re-read from Midtrans rather than trusted from the body.
    expect(midtrans.statusCalls).toEqual([order.orderNumber]);
  });

  it('rejects a notification with a wrong signature and changes nothing', async () => {
    const { order, product } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: order.total });

    const forged = {
      order_id: order.orderNumber,
      status_code: '200',
      gross_amount: `${order.total}.00`,
      transaction_status: 'settlement',
      fraud_status: 'accept',
      signature_key: 'a'.repeat(128),
    };
    const res = await request(app).post(NOTIFY).send(forged);

    expect(res.status).toBe(403);
    expect(midtrans.statusCalls).toHaveLength(0);
    expect((await Order.findById(order._id)).status).toBe('pending_payment');
    expect(await stockOf(product)).toBe(8);
  });

  it('rejects a notification whose amount was changed after signing', async () => {
    const { order } = await placeOrder();
    const body = notificationFor({
      order_id: order.orderNumber,
      gross_amount: `${order.total}.00`,
      transaction_status: 'settlement',
    });

    const res = await request(app)
      .post(NOTIFY)
      .send({ ...body, gross_amount: '1.00' });

    expect(res.status).toBe(403);
  });
});

describe('payment outcomes', () => {
  it('moves a settled order to processing, marks it paid and records the time', async () => {
    const { order } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: order.total });

    await notify(order, 'settlement');

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('processing');
    expect(updated.paymentStatus).toBe('paid');
    expect(updated.payment.paidAt).toBeInstanceOf(Date);
    expect(updated.payment.rawStatus).toBe('settlement');
    expect(updated.statusHistory.map((h) => [h.status, h.changedBy])).toEqual([
      ['pending_payment', String(order.user)],
      ['processing', 'system:midtrans'],
    ]);
  });

  it('keeps a pending transaction unchanged', async () => {
    const { order, product } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'pending', gross_amount: order.total });

    await notify(order, 'pending');

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('pending_payment');
    expect(updated.paymentStatus).toBe('unpaid');
    expect(updated.payment.rawStatus).toBe('pending');
    expect(await stockOf(product)).toBe(8);
  });

  it('cancels an expired order and restores its stock exactly once when notified twice', async () => {
    const { order, product } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'expire', gross_amount: order.total });

    expect((await notify(order, 'expire')).status).toBe(200);
    expect((await notify(order, 'expire')).status).toBe(200);

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('cancelled');
    expect(updated.paymentStatus).toBe('expired');
    expect(await stockOf(product)).toBe(10);
    expect(updated.statusHistory.filter((h) => h.status === 'cancelled')).toHaveLength(1);
  });

  it('cancels a denied payment and restores stock', async () => {
    const { order, product } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'deny', gross_amount: order.total });

    await notify(order, 'deny');

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('cancelled');
    expect(updated.paymentStatus).toBe('failed');
    expect(await stockOf(product)).toBe(10);
  });

  it('does not restore stock again when a settlement arrives after the order is already paid', async () => {
    const { order, product } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: order.total });

    await notify(order, 'settlement');
    await notify(order, 'settlement');

    const updated = await Order.findById(order._id);
    expect(updated.statusHistory.filter((h) => h.status === 'processing')).toHaveLength(1);
    expect(await stockOf(product)).toBe(8);
  });

  it('does not revive an order that was cancelled before the money arrived', async () => {
    const { order, product } = await placeOrder();
    await request(app).patch(`/api/orders/me/${order._id}/cancel`).set('Cookie', customerCookie);
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: order.total });

    await notify(order, 'settlement');

    const updated = await Order.findById(order._id);
    expect(updated.status).toBe('cancelled');
    expect(updated.paymentStatus).toBe('unpaid');
    expect(await stockOf(product)).toBe(10);
  });
});

describe('GET /api/orders/me/:id/payment-status (local fallback)', () => {
  it('applies the live Midtrans status to the order', async () => {
    const { order } = await placeOrder();
    midtrans.statusFor = (id) => statusBody(id, { transaction_status: 'settlement', gross_amount: order.total });

    const res = await request(app)
      .get(`/api/orders/me/${order._id}/payment-status`)
      .set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('processing');
    expect(res.body.data.paymentStatus).toBe('paid');
  });

  it('leaves the order unchanged when the customer has not started paying yet', async () => {
    const { order } = await placeOrder();

    const res = await request(app)
      .get(`/api/orders/me/${order._id}/payment-status`)
      .set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('pending_payment');
  });
});
