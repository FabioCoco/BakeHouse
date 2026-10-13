import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';

// Order status state machine. Anything not listed here is rejected with 400.
export const ALLOWED_TRANSITIONS = {
  pending_confirmation: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateOrderNumber = () => {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `BH-${day}-${String(randomInt(0, 10000)).padStart(4, '0')}`;
};

const toShippingSnapshot = (address) => ({
  recipientName: address.recipientName,
  phone: address.phone,
  street: address.street,
  city: address.city,
  province: address.province,
  postalCode: address.postalCode,
});

const outOfStockError = (product, quantity) =>
  ApiError.conflict(`"${product.name}" is out of stock`, [
    { product: product._id, name: product.name, requested: quantity, available: product.stock },
  ]);

// Runs `work` inside a MongoDB transaction. Any thrown error rolls back every write made so far.
const runInTransaction = async (work) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

const restoreStock = (items, session) =>
  Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    })),
    { session },
  );

// Checkout: prices come from the DB, stock is decremented atomically, and the cart is cleared.
export const checkout = ({ userId, addressId, address, paymentNote }) =>
  runInTransaction(async (session) => {
    let shipping;
    if (addressId) {
      const user = await User.findById(userId).session(session);
      const saved = user.addresses.id(addressId);
      if (!saved) {
        throw ApiError.notFound('Shipping address not found');
      }
      shipping = toShippingSnapshot(saved);
    } else {
      shipping = toShippingSnapshot(address);
    }

    const cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Your cart is empty');
    }

    const products = await Product.find({ _id: { $in: cart.items.map((i) => i.product) } }).session(session);
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    let subtotal = 0;

    for (const line of cart.items) {
      const product = productById.get(String(line.product));
      if (!product || !product.isActive) {
        throw ApiError.conflict('Some items are no longer available', [
          { product: line.product, reason: 'unavailable' },
        ]);
      }

      // Conditional update: succeeds only if enough stock is left at the moment of writing.
      const result = await Product.updateOne(
        { _id: product._id, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
        { session },
      );
      if (result.matchedCount === 0) {
        throw outOfStockError(product, line.quantity);
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: line.quantity,
        image: product.images[0],
      });
      subtotal += product.price * line.quantity;
    }

    const shippingFee = subtotal >= env.shipping.freeAbove ? 0 : env.shipping.flatFee;

    const [order] = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          user: userId,
          items,
          shippingAddress: shipping,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          paymentMethod: 'bank_transfer',
          paymentNote,
          status: 'pending_confirmation',
          statusHistory: [{ status: 'pending_confirmation', changedBy: userId }],
        },
      ],
      { session },
    );

    await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } }, { session });

    return order;
  });

// Shared by admin status changes and customer cancellation.
// `ownerId` restricts the order to one customer. `allowedFrom` restricts the source statuses.
export const transitionOrder = ({ orderId, nextStatus, changedBy, ownerId, allowedFrom }) =>
  runInTransaction(async (session) => {
    const filter = ownerId ? { _id: orderId, user: ownerId } : { _id: orderId };
    const order = await Order.findOne(filter).session(session);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (allowedFrom && !allowedFrom.includes(order.status)) {
      throw ApiError.badRequest(`Order can no longer be changed while it is "${order.status}"`);
    }

    if (!(ALLOWED_TRANSITIONS[order.status] || []).includes(nextStatus)) {
      throw ApiError.badRequest(`Cannot change order status from "${order.status}" to "${nextStatus}"`);
    }

    // Compare-and-set on the current status, so two concurrent updates cannot both succeed.
    const updateResult = await Order.updateOne(
      { _id: order._id, status: order.status },
      {
        $set: { status: nextStatus },
        $push: { statusHistory: { status: nextStatus, changedAt: new Date(), changedBy } },
      },
      { session },
    );
    if (updateResult.matchedCount === 0) {
      throw ApiError.conflict('Order was updated by someone else, please refresh and try again');
    }

    if (nextStatus === 'cancelled') {
      await restoreStock(order.items, session);
    }

    return Order.findById(order._id).session(session);
  });

export const listMyOrders = async (userId, query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildMeta({ page, limit, total }) };
};

export const getMyOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  return order;
};

export const listOrdersAdmin = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.search) {
    filter.orderNumber = { $regex: escapeRegex(query.search), $options: 'i' };
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildMeta({ page, limit, total }) };
};

export const getOrderAdmin = async (orderId) => {
  const order = await Order.findById(orderId).populate('user', 'name email').populate('statusHistory.changedBy', 'name');
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  return order;
};
