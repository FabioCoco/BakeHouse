import request from 'supertest';
import app from '../src/app.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { PASSWORD, createUser, loginCookie } from './helpers/factories.js';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe('POST /api/auth/register', () => {
  it('creates a customer, sets an httpOnly cookie and omits the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Rina', email: 'Rina@Example.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('rina@example.com');
    expect(res.body.data.role).toBe('customer');
    expect(res.body.data.password).toBeUndefined();

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('rejects a weak password with field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Rina', email: 'rina@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.map((e) => e.field)).toContain('password');
  });

  it('returns 409 when the email is already registered', async () => {
    await createUser({ email: 'taken@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Someone', email: 'taken@example.com', password: 'Password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    await createUser({ email: 'login@example.com' });

    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
  });

  it('returns 401 for a wrong password', async () => {
    await createUser({ email: 'login@example.com' });

    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('blocks NoSQL operator injection in the email field', async () => {
    await createUser({ email: 'login@example.com' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: PASSWORD });

    expect(res.status).toBe(400);
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the logged-in user with a valid cookie', async () => {
    await createUser({ email: 'me@example.com' });
    const cookie = await loginCookie(request(app), 'me@example.com');

    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@example.com');
  });
});
