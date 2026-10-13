import { Category } from '../../src/models/Category.js';
import { Product } from '../../src/models/Product.js';
import { User } from '../../src/models/User.js';
import { slugify } from '../../src/utils/slugify.js';

export const PASSWORD = 'Password123';

let sequence = 0;
const next = () => ++sequence;

export const createUser = (overrides = {}) =>
  User.create({
    name: 'Test User',
    email: `user${next()}@test.dev`,
    password: PASSWORD,
    ...overrides,
  });

export const createAdmin = () => createUser({ role: 'admin' });

export const createCategory = (name = `Category ${next()}`) =>
  Category.create({ name, slug: slugify(name), description: 'Test category' });

export const createProduct = (category, overrides = {}) => {
  const name = overrides.name ?? `Product ${next()}`;
  return Product.create({
    name,
    slug: slugify(name),
    description: 'Test product description.',
    price: 10000,
    stock: 10,
    category: category._id,
    origin: 'France',
    ...overrides,
  });
};

// Logs in through the real endpoint and returns the Set-Cookie header for later requests.
export const loginCookie = async (agent, email, password = PASSWORD) => {
  const res = await agent.post('/api/auth/login').send({ email, password });
  return res.headers['set-cookie'];
};

export const testAddress = {
  recipientName: 'Rina Putri',
  phone: '081234567890',
  street: 'Jl. Kemang Raya No. 12',
  city: 'Jakarta Selatan',
  province: 'DKI Jakarta',
  postalCode: '12730',
};
