import { Category } from '../models/Category.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';

// Analytics count only money that was actually paid. Days are UTC calendar days.
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };
const TOP_LIMIT = 5;
const LOW_STOCK_THRESHOLD = 5;

const startOfUtcDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const dayKey = (date) => date.toISOString().slice(0, 10);

const percentChange = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

// Revenue and order count for paid orders whose payment time falls in [from, to).
const paidTotals = async (from, to) => {
  const [row] = await Order.aggregate([
    { $match: { paymentStatus: 'paid', 'payment.paidAt': { $gte: from, $lt: to } } },
    { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  return { revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
};

// One entry per day in the range, with zeros for days that had no sales.
const revenueByDay = async (from, days, now) => {
  const rows = await Order.aggregate([
    { $match: { paymentStatus: 'paid', 'payment.paidAt': { $gte: from, $lt: now } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
  ]);
  const byDay = new Map(rows.map((row) => [row._id, row]));

  return Array.from({ length: days }, (_, index) => {
    const date = dayKey(new Date(from.getTime() + index * DAY_MS));
    const row = byDay.get(date);
    return { date, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 };
  });
};

// Products ranked by quantity and by revenue, from paid orders in the range.
const topProducts = async (from, now) => {
  const [result] = await Order.aggregate([
    { $match: { paymentStatus: 'paid', 'payment.paidAt': { $gte: from, $lt: now } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    {
      $facet: {
        byQuantity: [{ $sort: { quantity: -1, revenue: -1 } }, { $limit: TOP_LIMIT }],
        byRevenue: [{ $sort: { revenue: -1, quantity: -1 } }, { $limit: TOP_LIMIT }],
      },
    },
  ]);

  const shape = (rows) => rows.map((row) => ({ productId: row._id, name: row.name, quantity: row.quantity, revenue: row.revenue }));
  return { byQuantity: shape(result?.byQuantity ?? []), byRevenue: shape(result?.byRevenue ?? []) };
};

// Revenue per category, using each item's current product category.
const revenueByCategory = async (from, now) => {
  const rows = await Order.aggregate([
    { $match: { paymentStatus: 'paid', 'payment.paidAt': { $gte: from, $lt: now } } },
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $group: { _id: '$product.category', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { revenue: -1 } },
  ]);

  const categories = await Category.find({ _id: { $in: rows.map((r) => r._id) } }).select('name');
  const nameById = new Map(categories.map((c) => [String(c._id), c.name]));
  return rows.map((row) => ({ category: nameById.get(String(row._id)) ?? 'Tanpa kategori', revenue: row.revenue }));
};

// Share of orders created in the range that were eventually paid.
const conversion = async (from, now) => {
  const [created, paid] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: from, $lt: now } }),
    Order.countDocuments({ createdAt: { $gte: from, $lt: now }, paymentStatus: 'paid' }),
  ]);
  return { created, paid, rate: created ? Math.round((paid / created) * 1000) / 10 : 0 };
};

export const getAnalytics = async (range = '30d', now = new Date()) => {
  const days = RANGE_DAYS[range] ?? RANGE_DAYS['30d'];
  const from = new Date(startOfUtcDay(new Date(now.getTime() - (days - 1) * DAY_MS)));
  const previousFrom = new Date(from.getTime() - days * DAY_MS);

  const [current, previous, byDay, products, categories, funnel, lowStock] = await Promise.all([
    paidTotals(from, now),
    paidTotals(previousFrom, from),
    revenueByDay(from, days, now),
    topProducts(from, now),
    revenueByCategory(from, now),
    conversion(from, now),
    Product.find({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, name: 1 })
      .limit(10)
      .select('name slug stock images')
      .lean(),
  ]);

  const averageOrderValue = current.orders ? Math.round(current.revenue / current.orders) : 0;
  const previousAverage = previous.orders ? Math.round(previous.revenue / previous.orders) : 0;

  return {
    range,
    from: from.toISOString(),
    to: now.toISOString(),
    kpis: {
      revenue: { value: current.revenue, previous: previous.revenue, changePct: percentChange(current.revenue, previous.revenue) },
      orders: { value: current.orders, previous: previous.orders, changePct: percentChange(current.orders, previous.orders) },
      averageOrderValue: {
        value: averageOrderValue,
        previous: previousAverage,
        changePct: percentChange(averageOrderValue, previousAverage),
      },
      conversion: funnel,
    },
    revenueByDay: byDay,
    topProducts: products,
    revenueByCategory: categories,
    lowStock,
  };
};
