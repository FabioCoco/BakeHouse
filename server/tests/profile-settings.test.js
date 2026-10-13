import request from 'supertest';
import { AdminSettings } from '../src/models/AdminSettings.js';
import { User } from '../src/models/User.js';
import { signToken } from '../src/utils/token.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { createAdmin, createCategory, createUser, loginCookie, PASSWORD } from './helpers/factories.js';

const { default: app } = await import('../src/app.js');

beforeAll(startTestDb);
afterAll(stopTestDb);

let customer;
let customerCookie;
let adminCookie;

beforeEach(async () => {
  await clearTestDb();
  customer = await createUser({ email: 'profile@example.com', phone: '' });
  customerCookie = await loginCookie(request(app), customer.email);
  const admin = await createAdmin();
  adminCookie = await loginCookie(request(app), admin.email);
});

describe('profile', () => {
  it('updates the name and phone', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Cookie', customerCookie)
      .send({ name: 'Rina Putri', phone: '081234567890' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Rina Putri', phone: '081234567890' });
  });

  it('rejects an invalid phone number', async () => {
    const res = await request(app).patch('/api/users/me').set('Cookie', customerCookie).send({ phone: 'call me' });

    expect(res.status).toBe(400);
  });

  it('changes the password when the current one is correct', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Cookie', customerCookie)
      .send({ currentPassword: PASSWORD, newPassword: 'NewPassword9' });

    expect(res.status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: customer.email, password: 'NewPassword9' });
    expect(login.status).toBe(200);
  });

  it('refuses a wrong current password', async () => {
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Cookie', customerCookie)
      .send({ currentPassword: 'WrongPassword1', newPassword: 'NewPassword9' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('currentPassword');
  });

  it('refuses a password change for a Google-only account', async () => {
    const google = await User.create({ name: 'Google User', email: 'google-only@example.com', googleId: 'g-123' });
    const cookie = await loginCookieFromGoogle(google);

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Cookie', cookie)
      .send({ currentPassword: PASSWORD, newPassword: 'NewPassword9' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Google/);
  });
});

// Google-only accounts have no password, so they cannot log in with one. A session cookie is signed directly.
const loginCookieFromGoogle = async (user) => [`token=${signToken(user._id)}; Path=/; HttpOnly`];

describe('settings', () => {
  it('returns only active banners in sort order, with the announcement', async () => {
    const category = await createCategory('Featured');
    await AdminSettings.create({
      key: 'default',
      announcement: 'Gratis ongkir untuk pesanan di atas Rp250.000',
      banners: [
        { title: 'Second', image: 'second.jpg', sortOrder: 2 },
        { title: 'Hidden', image: 'hidden.jpg', isActive: false, sortOrder: 0 },
        { title: 'First', image: 'first.jpg', sortOrder: 1, ctaLabel: 'Lihat', ctaLink: '/products' },
      ],
      featuredCategories: [category._id],
    });

    const res = await request(app).get('/api/settings');

    expect(res.status).toBe(200);
    expect(res.body.data.announcement).toMatch(/Gratis ongkir/);
    expect(res.body.data.banners.map((b) => b.title)).toEqual(['First', 'Second']);
    expect(res.body.data.featuredCategories[0]).toMatchObject({ name: 'Featured' });
  });

  it('lets an admin replace banners, and blocks customers', async () => {
    const body = {
      announcement: 'Pesan sebelum jam 10 untuk pengiriman hari ini',
      banners: [{ title: 'Promo', image: 'promo.jpg', ctaLabel: 'Belanja', ctaLink: '/products', sortOrder: 1 }],
      featuredCategories: [],
    };

    const denied = await request(app).put('/api/admin/settings').set('Cookie', customerCookie).send(body);
    expect(denied.status).toBe(403);

    const res = await request(app).put('/api/admin/settings').set('Cookie', adminCookie).send(body);
    expect(res.status).toBe(200);
    expect(res.body.data.banners).toHaveLength(1);
  });

  it('rejects a banner image that is neither an https URL nor an image file name', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Cookie', adminCookie)
      .send({ banners: [{ title: 'Bad', image: 'javascript:alert(1)' }] });

    expect(res.status).toBe(400);
  });

  it('rejects a featured category that does not exist', async () => {
    const res = await request(app)
      .put('/api/admin/settings')
      .set('Cookie', adminCookie)
      .send({ featuredCategories: ['6ace202972c74decc9a0cead'] });

    expect(res.status).toBe(400);
  });
});
