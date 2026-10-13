import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';

export const LOW_STOCK_THRESHOLD = 5;
const LATEST_ORDERS_LIMIT = 5;

export const getDashboardSummary = async () => {
  const [revenueRows, statusRows, activeProducts, lowStockProducts, latestOrders] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          // Revenue counts only money that has actually been paid. Refunded orders drop out.
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] },
          },
        },
      },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.countDocuments({ isActive: true }),
    Product.find({ isActive: true, stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1, name: 1 })
      .select('name slug stock images')
      .lean(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(LATEST_ORDERS_LIMIT)
      .populate('user', 'name email')
      .select('orderNumber status paymentStatus total createdAt user')
      .lean(),
  ]);

  const totals = revenueRows[0] ?? { totalOrders: 0, totalRevenue: 0 };

  // Every status appears in the result, even when its count is zero.
  const ordersByStatus = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));
  for (const row of statusRows) {
    ordersByStatus[row._id] = row.count;
  }

  return {
    totalOrders: totals.totalOrders,
    totalRevenue: totals.totalRevenue,
    activeProducts,
    ordersByStatus,
    lowStockProducts,
    latestOrders,
  };
};
