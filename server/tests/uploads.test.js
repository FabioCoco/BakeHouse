import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';
import { createAdmin, createUser, loginCookie } from './helpers/factories.js';

const { default: app } = await import('../src/app.js');

beforeAll(startTestDb);
afterAll(stopTestDb);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, '../public/uploads');

const created = [];
let adminCookie;
let customerCookie;

beforeEach(async () => {
  await clearTestDb();
  const admin = await createAdmin();
  adminCookie = await loginCookie(request(app), admin.email);
  const customer = await createUser({ email: 'uploader@example.com' });
  customerCookie = await loginCookie(request(app), customer.email);
});

afterAll(() => {
  // Remove only the files these tests created.
  for (const file of created) {
    if (existsSync(file)) unlinkSync(file);
  }
});

const PNG_BYTES = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

const upload = (cookie, kind, file) =>
  request(app)
    .post(`/api/admin/uploads?kind=${kind}`)
    .set('Cookie', cookie)
    .attach('file', file.buffer, { filename: file.filename, contentType: file.contentType });

describe('POST /api/admin/uploads', () => {
  it('stores a banner image under uploads/banners and returns its file name and URL', async () => {
    const res = await upload(adminCookie, 'banner', { buffer: PNG_BYTES, filename: 'promo.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.filename).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(res.body.data.url).toBe(`/uploads/banners/${res.body.data.filename}`);
    const saved = path.join(UPLOADS, 'banners', res.body.data.filename);
    created.push(saved);
    expect(existsSync(saved)).toBe(true);
  });

  it('stores a product image in the uploads root', async () => {
    const res = await upload(adminCookie, 'product', { buffer: PNG_BYTES, filename: 'croissant.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toBe(`/uploads/${res.body.data.filename}`);
    created.push(path.join(UPLOADS, res.body.data.filename));
  });

  it('refuses customers', async () => {
    const res = await upload(customerCookie, 'product', { buffer: PNG_BYTES, filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
  });

  it('refuses files that are not images', async () => {
    const res = await upload(adminCookie, 'product', { buffer: Buffer.from('hello'), filename: 'note.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JPG, PNG, WebP, or AVIF/);
  });

  it('refuses files larger than 2 MB', async () => {
    const big = Buffer.alloc(2 * 1024 * 1024 + 1);
    const res = await upload(adminCookie, 'banner', { buffer: big, filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
  });

  it('requires a valid kind and a file', async () => {
    const badKind = await request(app)
      .post('/api/admin/uploads?kind=video')
      .set('Cookie', adminCookie)
      .attach('file', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(badKind.status).toBe(400);

    const noFile = await request(app).post('/api/admin/uploads?kind=product').set('Cookie', adminCookie);
    expect(noFile.status).toBe(400);
  });
});
