import request from 'supertest';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { Review } from '../src/models/Review.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { createAdmin, createCategory, createProduct, createUser, loginCookie, testAddress } from './helpers/factories.js';

// Reviews need no Midtrans call, so the app can load directly.
const { default: app } = await import('../src/app.js');

beforeAll(startTestDb);
afterAll(stopTestDb);

const COMMENT = 'Really good texture and flavour, would buy again.';

let category;
let product;
let customer;
let customerCookie;
let adminCookie;

beforeEach(async () => {
  await clearTestDb();
  category = await createCategory('Reviewed Category');
  product = await createProduct(category, { name: 'Reviewed Bun', price: 20000, stock: 10 });
  customer = await createUser({ email: 'reviewer@example.com' });
  customerCookie = await loginCookie(request(app), customer.email);
  const admin = await createAdmin();
  adminCookie = await loginCookie(request(app), admin.email);
});

// A completed order is the only thing that makes a customer eligible to review a product.
const completeOrderFor = async (user, item = product) =>
  Order.create({
    orderNumber: `BH-TEST-${Math.random().toString(36).slice(2, 8)}`,
    user: user._id,
    items: [{ product: item._id, name: item.name, price: item.price, quantity: 1, slug: item.slug }],
    shippingAddress: testAddress,
    subtotal: item.price,
    shippingFee: 0,
    total: item.price,
    paymentExpiresAt: new Date(),
    status: 'completed',
    paymentStatus: 'paid',
  });

const postReview = (body, cookie = customerCookie, slug = product.slug) =>
  request(app).post(`/api/products/${slug}/reviews`).set('Cookie', cookie).send(body);

const productRating = async () => {
  const fresh = await Product.findById(product._id);
  return { average: fresh.ratingAverage, count: fresh.ratingCount };
};

describe('creating a review', () => {
  it('rejects a customer who has no completed order for the product', async () => {
    const res = await postReview({ rating: 5, comment: COMMENT });

    expect(res.status).toBe(403);
    expect(await Review.countDocuments({})).toBe(0);
  });

  it('rejects an order that is not completed yet', async () => {
    const order = await completeOrderFor(customer);
    await Order.updateOne({ _id: order._id }, { status: 'processing' });

    const res = await postReview({ rating: 5, comment: COMMENT });

    expect(res.status).toBe(403);
  });

  it('accepts a review from a verified buyer and updates the product rating', async () => {
    await completeOrderFor(customer);

    const res = await postReview({ rating: 4, comment: COMMENT });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ rating: 4, comment: COMMENT });
    expect(res.body.data.user.name).toBe(customer.name);
    expect(await productRating()).toEqual({ average: 4, count: 1 });
  });

  it('allows only one review per product per customer', async () => {
    await completeOrderFor(customer);
    await postReview({ rating: 4, comment: COMMENT });

    const res = await postReview({ rating: 2, comment: 'Changed my mind about this one.' });

    expect(res.status).toBe(409);
    expect(await Review.countDocuments({})).toBe(1);
  });

  it('validates rating and comment length', async () => {
    await completeOrderFor(customer);

    expect((await postReview({ rating: 6, comment: COMMENT })).status).toBe(400);
    expect((await postReview({ rating: 3, comment: 'too short' })).status).toBe(400);
  });
});

describe('ratings', () => {
  it('rounds the average to one decimal across several reviews', async () => {
    const reviewers = [];
    for (const rating of [5, 4, 4]) {
      const user = await createUser({ email: `buyer${rating}${reviewers.length}@example.com` });
      await completeOrderFor(user);
      reviewers.push(user);
      const cookie = await loginCookie(request(app), user.email);
      await postReview({ rating, comment: COMMENT }, cookie);
    }

    expect(await productRating()).toEqual({ average: 4.3, count: 3 });
  });

  it('recalculates when the customer edits and deletes their review', async () => {
    await completeOrderFor(customer);
    await postReview({ rating: 5, comment: COMMENT });

    const edited = await request(app)
      .patch(`/api/products/${product.slug}/reviews`)
      .set('Cookie', customerCookie)
      .send({ rating: 2 });
    expect(edited.status).toBe(200);
    expect(await productRating()).toEqual({ average: 2, count: 1 });

    const removed = await request(app).delete(`/api/products/${product.slug}/reviews`).set('Cookie', customerCookie);
    expect(removed.status).toBe(200);
    expect(await productRating()).toEqual({ average: 0, count: 0 });
  });

  it('does not let a customer edit a review they did not write', async () => {
    await completeOrderFor(customer);
    await postReview({ rating: 5, comment: COMMENT });
    const other = await createUser({ email: 'other-reviewer@example.com' });
    const otherCookie = await loginCookie(request(app), other.email);

    const res = await request(app)
      .patch(`/api/products/${product.slug}/reviews`)
      .set('Cookie', otherCookie)
      .send({ rating: 1 });

    expect(res.status).toBe(404);
    expect((await Review.findOne({})).rating).toBe(5);
  });
});

describe('public review list', () => {
  it('returns newest first by default with a rating distribution', async () => {
    const first = await createUser({ email: 'first@example.com' });
    const second = await createUser({ email: 'second@example.com' });
    await completeOrderFor(first);
    await completeOrderFor(second);
    await Review.create({ product: product._id, user: first._id, order: (await Order.findOne({ user: first._id }))._id, rating: 3, comment: 'Older review text here.', createdAt: new Date(Date.now() - 60000) });
    await Review.create({ product: product._id, user: second._id, order: (await Order.findOne({ user: second._id }))._id, rating: 5, comment: 'Newer review text here.' });

    const res = await request(app).get(`/api/products/${product.slug}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r.rating)).toEqual([5, 3]);
    expect(res.body.meta.distribution).toEqual({ 1: 0, 2: 0, 3: 1, 4: 0, 5: 1 });
    expect(res.body.meta.total).toBe(2);
  });

  it('sorts by highest rating when asked', async () => {
    const first = await createUser({ email: 'low@example.com' });
    const second = await createUser({ email: 'high@example.com' });
    const firstOrder = await completeOrderFor(first);
    const secondOrder = await completeOrderFor(second);
    await Review.create({ product: product._id, user: first._id, order: firstOrder._id, rating: 2, comment: 'Not my favourite bun.' });
    await Review.create({ product: product._id, user: second._id, order: secondOrder._id, rating: 5, comment: 'Best bun on the shelf.' });

    const res = await request(app).get(`/api/products/${product.slug}/reviews?sort=highest`);

    expect(res.body.data.map((r) => r.rating)).toEqual([5, 2]);
  });

  it('returns 404 for an unknown product', async () => {
    const res = await request(app).get('/api/products/does-not-exist/reviews');

    expect(res.status).toBe(404);
  });

  it('returns null from /me when the customer has not reviewed yet', async () => {
    const res = await request(app).get(`/api/products/${product.slug}/reviews/me`).set('Cookie', customerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

describe('admin moderation', () => {
  it('hides a review from the public list and the rating, then restores both', async () => {
    await completeOrderFor(customer);
    const created = await postReview({ rating: 1, comment: COMMENT });
    expect(await productRating()).toEqual({ average: 1, count: 1 });

    const hidden = await request(app)
      .patch(`/api/admin/reviews/${created.body.data._id}/visibility`)
      .set('Cookie', adminCookie)
      .send({ isHidden: true });
    expect(hidden.status).toBe(200);
    expect(await productRating()).toEqual({ average: 0, count: 0 });

    const publicList = await request(app).get(`/api/products/${product.slug}/reviews`);
    expect(publicList.body.data).toHaveLength(0);

    const shown = await request(app)
      .patch(`/api/admin/reviews/${created.body.data._id}/visibility`)
      .set('Cookie', adminCookie)
      .send({ isHidden: false });
    expect(shown.status).toBe(200);
    expect(await productRating()).toEqual({ average: 1, count: 1 });
  });

  it('lists reviews filtered by visibility for the admin', async () => {
    await completeOrderFor(customer);
    const created = await postReview({ rating: 3, comment: COMMENT });
    await request(app)
      .patch(`/api/admin/reviews/${created.body.data._id}/visibility`)
      .set('Cookie', adminCookie)
      .send({ isHidden: true });

    const hidden = await request(app).get('/api/admin/reviews?visibility=hidden').set('Cookie', adminCookie);
    const visible = await request(app).get('/api/admin/reviews?visibility=visible').set('Cookie', adminCookie);

    expect(hidden.body.data).toHaveLength(1);
    expect(hidden.body.data[0].product.name).toBe(product.name);
    expect(visible.body.data).toHaveLength(0);
  });

  it('blocks customers from moderation', async () => {
    await completeOrderFor(customer);
    const created = await postReview({ rating: 3, comment: COMMENT });

    const res = await request(app)
      .patch(`/api/admin/reviews/${created.body.data._id}/visibility`)
      .set('Cookie', customerCookie)
      .send({ isHidden: true });

    expect(res.status).toBe(403);
  });
});
