import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import { Cart } from '../models/Cart.js';
import { Category } from '../models/Category.js';
import { env } from '../config/env.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { recalcProductRating } from '../services/reviewService.js';
import { effectivePriceOf } from '../utils/pricing.js';
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

// Extra demo customers so the sample reviews come from different people (one review per customer per product).
DEMO_CUSTOMERS.push(
  {
    name: 'Dewi Lestari',
    email: 'dewi@example.com',
    addresses: [
      {
        label: 'Home',
        recipientName: 'Dewi Lestari',
        phone: '081211122233',
        street: 'Jl. Dago Atas No. 5',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '40135',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Andi Wijaya',
    email: 'andi@example.com',
    addresses: [
      {
        label: 'Home',
        recipientName: 'Andi Wijaya',
        phone: '081355566677',
        street: 'Jl. Gubeng Kertajaya 8',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postalCode: '60282',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Sari Handayani',
    email: 'sari@example.com',
    addresses: [
      {
        label: 'Home',
        recipientName: 'Sari Handayani',
        phone: '081977788899',
        street: 'Jl. Malioboro 22',
        city: 'Yogyakarta',
        province: 'DI Yogyakarta',
        postalCode: '55213',
        isDefault: true,
      },
    ],
  },
  {
    name: 'Yoga Pratama',
    email: 'yoga@example.com',
    addresses: [
      {
        label: 'Office',
        recipientName: 'Yoga Pratama',
        phone: '081433322211',
        street: 'Jl. Pemuda 14',
        city: 'Semarang',
        province: 'Jawa Tengah',
        postalCode: '50132',
        isDefault: true,
      },
    ],
  },
);

const destroyAll = async () => {
  await Promise.all([
    Order.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);
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
  const customersByEmail = new Map();
  for (const customer of DEMO_CUSTOMERS) {
    customersByEmail.set(customer.email, await User.create({ ...customer, password: customerPassword }));
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
      // Seed discounts have no dates, so they stay active until an admin changes them.
      discountPercent: p.discountPercent ?? 0,
      category: categoryId,
      // Image files are added by hand, named after the product slug.
      images: [`${slug}.jpg`],
    };
  });
  const savedProducts = await Product.insertMany(products);
  console.log(`Created ${savedProducts.length} products`);

  await importSampleOrders(savedProducts, customersByEmail);
};

// Completed orders for the demo customers, each with the reviews they could leave.
// Reviews are only possible after a completed order, so the seed follows the same rule.
const importSampleOrders = async (savedProducts, customersByEmail) => {
  const sampleOrders = await readData('sample-orders.json');
  const productByName = new Map(savedProducts.map((p) => [p.name, p]));
  const reviewedProducts = new Set();

  for (const [index, sample] of sampleOrders.entries()) {
    const customer = customersByEmail.get(sample.customer);
    const shipping = DEMO_CUSTOMERS.find((c) => c.email === sample.customer).addresses[0];
    const now = new Date();

    const items = sample.items.map((line) => {
      const product = productByName.get(line.product);
      if (!product) throw new Error(`Unknown product "${line.product}" in sample orders`);
      return {
        product: product._id,
        name: product.name,
        price: effectivePriceOf(product, now),
        originalPrice: product.price,
        discountPercent: product.discountPercent,
        quantity: line.quantity,
        image: product.images[0],
        slug: product.slug,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingFee = subtotal >= env.shipping.freeAbove ? 0 : env.shipping.flatFee;

    const order = await Order.create({
      orderNumber: `BH-SEED-${String(index + 1).padStart(4, '0')}`,
      user: customer._id,
      items,
      shippingAddress: {
        recipientName: shipping.recipientName,
        phone: shipping.phone,
        street: shipping.street,
        city: shipping.city,
        province: shipping.province,
        postalCode: shipping.postalCode,
      },
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      source: 'cart',
      status: 'completed',
      paymentStatus: 'paid',
      payment: { provider: 'midtrans', transactionId: `seed-${index + 1}`, paymentType: 'bank_transfer', paidAt: now, rawStatus: 'settlement' },
      paymentExpiresAt: now,
      statusHistory: [
        { status: 'pending_payment', changedAt: now, changedBy: 'system:seed' },
        { status: 'processing', changedAt: now, changedBy: 'system:midtrans' },
        { status: 'shipped', changedAt: now, changedBy: 'system:seed' },
        { status: 'completed', changedAt: now, changedBy: 'system:seed' },
      ],
    });

    for (const review of sample.reviews) {
      const product = productByName.get(review.product);
      await Review.create({
        product: product._id,
        user: customer._id,
        order: order._id,
        rating: review.rating,
        comment: review.comment,
      });
      reviewedProducts.add(product._id);
    }
  }

  for (const productId of reviewedProducts) {
    await recalcProductRating(productId);
  }
  console.log(`Created ${sampleOrders.length} completed sample orders with reviews`);
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
