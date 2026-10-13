import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import { Cart } from '../models/Cart.js';
import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { slugify } from '../utils/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readData = async (file) => JSON.parse(await readFile(path.join(__dirname, 'data', file), 'utf8'));

const DEMO_CUSTOMERS = [
  {
    name: 'Rina Putri',
    email: 'rina@example.com',
    addresses: [
      {
        label: 'Home',
        recipientName: 'Rina Putri',
        phone: '081234567890',
        street: 'Jl. Kemang Raya No. 12',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12730',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Budi Santoso',
    email: 'budi@example.com',
    addresses: [
      {
        label: 'Office',
        recipientName: 'Budi Santoso',
        phone: '081298765432',
        street: 'Jl. Sudirman Kav. 21',
        city: 'Jakarta Pusat',
        province: 'DKI Jakarta',
        postalCode: '10220',
        isDefault: true,
      },
    ],
  },
];

const destroyAll = async () => {
  await Promise.all([Order.deleteMany({}), Cart.deleteMany({}), Product.deleteMany({}), Category.deleteMany({}), User.deleteMany({})]);
  console.log('All BakeHouse data deleted');
};

const importData = async () => {
  if (await Category.exists({})) {
    throw new Error('Database already contains data. Run "npm run seed:destroy" first.');
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env');
  }

  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'Customer123';

  await User.create({ name: 'BakeHouse Admin', email: adminEmail, password: adminPassword, role: 'admin' });
  for (const customer of DEMO_CUSTOMERS) {
    await User.create({ ...customer, password: customerPassword });
  }
  console.log(`Created 1 admin and ${DEMO_CUSTOMERS.length} demo customers`);

  const categoryData = await readData('categories.json');
  const categories = await Category.insertMany(
    categoryData.map((c) => ({ ...c, slug: slugify(c.name) })),
  );
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c._id]));
  console.log(`Created ${categories.length} categories`);

  const productData = await readData('products.json');
  const products = productData.map((p) => {
    const slug = slugify(p.name);
    const categoryId = categoryBySlug.get(p.category);
    if (!categoryId) {
      throw new Error(`Unknown category "${p.category}" for product "${p.name}"`);
    }
    return {
      name: p.name,
      slug,
      description: p.description,
      price: p.price,
      stock: p.stock,
      origin: p.origin,
      category: categoryId,
      // Image files are added by hand, named after the product slug.
      images: [`${slug}.jpg`],
    };
  });
  await Product.insertMany(products);
  console.log(`Created ${products.length} products`);
};

const run = async () => {
  await connectDB();
  try {
    if (process.argv.includes('--destroy')) {
      await destroyAll();
    } else {
      await importData();
      console.log(`Seed complete. Admin login: ${process.env.SEED_ADMIN_EMAIL}`);
    }
  } finally {
    await disconnectDB();
  }
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
});
