import request from 'supertest';
import { Order } from '../src/models/Order.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { createAdmin, createCategory, createProduct, createUser, loginCookie, testAddress } from './helpers/factories.js';

const { default: app } = await import('../src/app.js');

beforeAll(startTestDb);
afterAll(stopTestDb);

const DAY = 24 * 60 * 60 * 1000;
let adminCookie;
let customer;
let bakery;
let croissant;
let cake;

beforeEach(async () => {
  await clearTestDb();
  bakery = await createCategory('Analytics Pastry');
  croissant = await createProduct(bakery, { name: 'Croissant Analytics', price: 20000, stock: 50 });
  cake = await createProduct(bakery, { name: 'Cake Analytics', price: 100000, stock: 5 });
  customer = await createUser({ email: 'analytics-buyer@example.com' });
  const admin = await createAdmin();
  adminCookie = await loginCookie(request(app), admin.email);
});

let counter = 0;
// Creates an order with a given payment time. Pass paymentStatus 'unpaid' to model an order that never got paid.
const makeOrder = ({ paidAt, lines, paymentStatus = 'paid', createdAt }) => {
  counter += 1;
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return Order.create({
    orderNumber: `BH-ANALYTICS-${counter}`,
    user: customer._id,
    items: lines.map((line) => ({ product: line.product._id, name: line.product.name, price: line.price, quantity: line.quantity })),
    shippingAddress: testAddress,
    subtotal,
    shippingFee: 0,
    total: subtotal,
    paymentExpiresAt: new Date(),
    status: paymentStatus === 'paid' ? 'completed' : 'pending_payment',
    paymentStatus,
    payment: paidAt ? { paidAt } : {},
    ...(createdAt ? { createdAt } : {}),
  });
};

const analytics = (range = '7d') => request(app).get(`/api/admin/analytics?range=${range}`).set('Cookie', adminCookie);

describe('GET /api/admin/analytics', () => {
  it('rejects an unknown range', async () => {
    const res = await analytics('1y');

    expect(res.status).toBe(400);
  });

  it('counts only paid orders and fills every day of the range with a value', async () => {
    const now = new Date();
    await makeOrder({ paidAt: new Date(now.getTime() - DAY), lines: [{ product: croissant, price: 20000, quantity: 2 }] });
    await makeOrder({ paymentStatus: 'unpaid', lines: [{ product: cake, price: 100000, quantity: 1 }] });

    const res = await analytics('7d');

    expect(res.status).toBe(200);
    expect(res.body.data.revenueByDay).toHaveLength(7);
    const paidDays = res.body.data.revenueByDay.filter((day) => day.revenue > 0);
    expect(paidDays).toHaveLength(1);
    expect(paidDays[0]).toMatchObject({ revenue: 40000, orders: 1 });
    expect(res.body.data.kpis.revenue.value).toBe(40000);
    expect(res.body.data.kpis.orders.value).toBe(1);
  });

  it('computes the change against the previous period', async () => {
    const now = new Date();
    await makeOrder({ paidAt: new Date(now.getTime() - DAY), lines: [{ product: croissant, price: 20000, quantity: 1 }] });
    await makeOrder({ paidAt: new Date(now.getTime() - 10 * DAY), lines: [{ product: croissant, price: 20000, quantity: 2 }] });

    const res = await analytics('7d');

    expect(res.body.data.kpis.revenue).toMatchObject({ value: 20000, previous: 40000, changePct: -50 });
    expect(res.body.data.kpis.averageOrderValue.value).toBe(20000);
  });

  it('ranks top products by quantity and by revenue', async () => {
    const now = new Date();
    await makeOrder({
      paidAt: new Date(now.getTime() - DAY),
      lines: [
        { product: croissant, price: 20000, quantity: 5 },
        { product: cake, price: 150000, quantity: 1 },
      ],
    });

    const res = await analytics('7d');
    const { topProducts } = res.body.data;

    expect(topProducts.byQuantity[0]).toMatchObject({ name: 'Croissant Analytics', quantity: 5, revenue: 100000 });
    expect(topProducts.byRevenue[0]).toMatchObject({ name: 'Cake Analytics', revenue: 150000 });
  });

  it('groups revenue by category using the product category', async () => {
    const now = new Date();
    await makeOrder({ paidAt: new Date(now.getTime() - DAY), lines: [{ product: croissant, price: 20000, quantity: 3 }] });

    const res = await analytics('7d');

    expect(res.body.data.revenueByCategory).toEqual([{ category: 'Analytics Pastry', revenue: 60000 }]);
  });

  it('reports conversion from orders created to orders paid', async () => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - DAY);
    await makeOrder({ paidAt: createdAt, createdAt, lines: [{ product: croissant, price: 20000, quantity: 1 }] });
    await makeOrder({ paymentStatus: 'unpaid', createdAt, lines: [{ product: croissant, price: 20000, quantity: 1 }] });

    const res = await analytics('7d');

    expect(res.body.data.kpis.conversion).toMatchObject({ created: 2, paid: 1, rate: 50 });
  });

  it('is only available to admins', async () => {
    const customerCookie = await loginCookie(request(app), customer.email);

    const res = await request(app).get('/api/admin/analytics').set('Cookie', customerCookie);

    expect(res.status).toBe(403);
  });
});
