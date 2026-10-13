import request from 'supertest';
import app from '../src/app.js';
import { Product } from '../src/models/Product.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { createAdmin, createCategory, createProduct, createUser, loginCookie } from './helpers/factories.js';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe('GET /api/products', () => {
  it('lists only active products with pagination meta', async () => {
    const category = await createCategory('French Pastry');
    await createProduct(category, { name: 'Butter Croissant', price: 22000 });
    await createProduct(category, { name: 'Pain au Chocolat', price: 24000 });
    await createProduct(category, { name: 'Retired Item', isActive: false });

    const res = await request(app).get('/api/products?limit=10');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });
  });

  it('filters by category slug, origin and price range', async () => {
    const pastry = await createCategory('French Pastry');
    const bread = await createCategory('Savory Bread');
    await createProduct(pastry, { name: 'Croissant', price: 22000, origin: 'France' });
    await createProduct(pastry, { name: 'Expensive Tart', price: 90000, origin: 'France' });
    await createProduct(bread, { name: 'Focaccia', price: 55000, origin: 'Italy' });

    const byCategory = await request(app).get(`/api/products?category=${pastry.slug}`);
    expect(byCategory.body.data.map((p) => p.name).sort()).toEqual(['Croissant', 'Expensive Tart']);

    const byOrigin = await request(app).get('/api/products?origin=Italy');
    expect(byOrigin.body.data.map((p) => p.name)).toEqual(['Focaccia']);

    const byPrice = await request(app).get('/api/products?minPrice=20000&maxPrice=60000');
    expect(byPrice.body.data.map((p) => p.name).sort()).toEqual(['Croissant', 'Focaccia']);
  });

  it('rejects an unknown sort value', async () => {
    const res = await request(app).get('/api/products?sort=dragons');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/:slug', () => {
  it('returns 404 for a soft-deleted product', async () => {
    const category = await createCategory();
    const product = await createProduct(category, { name: 'Hidden Bun', isActive: false });

    const res = await request(app).get(`/api/products/${product.slug}`);
    expect(res.status).toBe(404);
  });
});

describe('product admin routes', () => {
  it('forbids customers from creating products', async () => {
    const category = await createCategory();
    await createUser({ email: 'customer@example.com' });
    const cookie = await loginCookie(request(app), 'customer@example.com');

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', cookie)
      .send({ name: 'Sneaky', description: 'x', price: 1000, category: category._id });

    expect(res.status).toBe(403);
  });

  it('creates a product with a generated slug for an admin', async () => {
    const category = await createCategory();
    const admin = await createAdmin();
    const cookie = await loginCookie(request(app), admin.email);

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', cookie)
      .send({
        name: 'Crème Brûlée Tart',
        description: 'Custard tart.',
        price: 65000,
        category: String(category._id),
        stock: 7,
        images: ['creme-brulee-tart.jpg'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('creme-brulee-tart');
    expect(res.body.data.stock).toBe(7);
  });

  it('rejects stock going below zero with 409 and leaves stock unchanged', async () => {
    const category = await createCategory();
    const product = await createProduct(category, { stock: 2 });
    const admin = await createAdmin();
    const cookie = await loginCookie(request(app), admin.email);

    const res = await request(app)
      .patch(`/api/products/${product._id}/stock`)
      .set('Cookie', cookie)
      .send({ adjustment: -5 });

    expect(res.status).toBe(409);
    const fresh = await Product.findById(product._id);
    expect(fresh.stock).toBe(2);
  });

  it('soft-deletes a product by setting isActive to false', async () => {
    const category = await createCategory();
    const product = await createProduct(category);
    const admin = await createAdmin();
    const cookie = await loginCookie(request(app), admin.email);

    const res = await request(app).delete(`/api/products/${product._id}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect((await Product.findById(product._id)).isActive).toBe(false);
  });
});
