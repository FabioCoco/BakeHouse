import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import { createSnapTransaction, getTransactionStatus } from './midtransService.js';

export const PAYMENT_WINDOW_HOURS = 24;
export const MIDTRANS_ACTOR = 'system:midtrans';

// Order status state machine. Anything not listed here is rejected with 400.
// pending_payment only moves to processing through a Midtrans notification, never by hand.
export const ALLOWED_TRANSITIONS = {
  pending_payment: ['cancelled'],
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
export const runInTransaction = async (work) => {
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

export const restoreStock = (items, session) =>
  Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { stock: item.quantity } },
      },
    })),
    { session },
  );

// Drops keys whose value is undefined, so optional payment fields never overwrite stored values with nothing.
const definedOnly = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

// Checkout: prices come from the DB, stock is decremented atomically, and the cart is cleared.
// After the commit, a Snap transaction is created. If Midtrans fails, the order is cancelled and everything is restored.
export const checkout = async ({ userId, addressId, address, paymentNote, buyNow }) => {
  const source = buyNow ? 'buy_now' : 'cart';

  const order = await runInTransaction(async (session) => {
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

    // Buy now checks out one product and never reads or changes the cart.
    let cart = null;
    let lines;
    if (buyNow) {
      lines = [{ product: buyNow.productId, quantity: buyNow.quantity }];
    } else {
      cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Your cart is empty');
      }
      lines = cart.items;
    }

    const products = await Product.find({ _id: { $in: lines.map((i) => i.product) } }).session(session);
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const items = [];
    let subtotal = 0;
    const now = new Date();

    for (const line of lines) {
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

      // The discount is computed here from the server clock. The client's price is never used.
      const unitPrice = product.effectivePrice;
      items.push({
        product: product._id,
        name: product.name,
        price: unitPrice,
        originalPrice: product.price,
        discountPercent: product.isOnSale ? product.discountPercent : 0,
        quantity: line.quantity,
        image: product.images[0],
      });
      subtotal += unitPrice * line.quantity;
    }

    const shippingFee = subtotal >= env.shipping.freeAbove ? 0 : env.shipping.flatFee;

    const [created] = await Order.create(
      [
        {
          orderNumber: generateOrderNumber(),
          user: userId,
          items,
          shippingAddress: shipping,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          paymentNote,
          source,
          status: 'pending_payment',
          paymentStatus: 'unpaid',
          paymentExpiresAt: new Date(now.getTime() + PAYMENT_WINDOW_HOURS * 60 * 60 * 1000),
          statusHistory: [{ status: 'pending_payment', changedAt: now, changedBy: String(userId) }],
        },
      ],
      { session },
    );

    if (cart) {
      await Cart.updateOne({ _id: cart._id }, { $set: { items: [] } }, { session });
    }

    return created;
  });

  const user = await User.findById(userId).lean();
  let snap;
  try {
    snap = await createSnapTransaction(buildSnapParams(order, user));
  } catch (err) {
    console.error('Snap transaction failed for', order.orderNumber, err.message);
    await cancelFailedCheckout(order);
    throw new ApiError(502, 'Pembayaran belum bisa dibuat. Pesanan dibatalkan, silakan coba lagi.');
  }

  await Order.updateOne(
    { _id: order._id },
    { $set: { 'payment.provider': 'midtrans', 'payment.snapToken': snap.token, 'payment.redirectUrl': snap.redirect_url } },
  );
  return {
    order: await Order.findById(order._id),
    snapToken: snap.token,
    redirectUrl: snap.redirect_url,
    clientKey: env.midtrans.clientKey,
  };
};

// Builds the Snap request. item_details must add up to gross_amount exactly, so the total is checked first.
export const buildSnapParams = (order, user) => {
  const itemDetails = order.items.map((item) => ({
    id: String(item.product),
    price: item.price,
    quantity: item.quantity,
    name: item.name.slice(0, 50),
  }));
  if (order.shippingFee > 0) {
    itemDetails.push({ id: 'SHIPPING', price: order.shippingFee, quantity: 1, name: 'Ongkos Kirim' });
  }

  const itemTotal = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (itemTotal !== order.total) {
    throw new Error(`Item total ${itemTotal} does not match order total ${order.total}`);
  }

  const address = order.shippingAddress;
  return {
    transaction_details: { order_id: order.orderNumber, gross_amount: order.total },
    item_details: itemDetails,
    customer_details: {
      first_name: address.recipientName,
      email: user?.email,
      phone: address.phone,
      shipping_address: {
        first_name: address.recipientName,
        phone: address.phone,
        address: address.street,
        city: address.city,
        postal_code: address.postalCode,
        country_code: 'IDN',
      },
    },
    expiry: { unit: 'hour', duration: PAYMENT_WINDOW_HOURS },
    callbacks: { finish: `${env.clientUrl}/orders/${order._id}` },
  };
};

// Compensation for a failed Snap call: cancel the order, restore stock, and put the cart back as it was.
const cancelFailedCheckout = (order) =>
  runInTransaction(async (session) => {
    const result = await Order.updateOne(
      { _id: order._id, status: 'pending_payment' },
      {
        $set: { status: 'cancelled', paymentStatus: 'failed' },
        $push: { statusHistory: { status: 'cancelled', changedAt: new Date(), changedBy: String(order.user) } },
      },
      { session },
    );
    if (result.matchedCount === 0) return;

    await restoreStock(order.items, session);

    // Buy now never emptied the cart, so there is nothing to put back.
    if (order.source === 'cart') {
      await Cart.updateOne(
        { user: order.user },
        { $set: { items: order.items.map((item) => ({ product: item.product, quantity: item.quantity })) } },
        { upsert: true, session },
      );
    }
  });

// Returns the existing Snap token so the customer can resume an unpaid order.
export const payOrder = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (order.status !== 'pending_payment' || order.paymentStatus !== 'unpaid') {
    throw ApiError.conflict('This order is no longer waiting for payment');
  }
  if (order.paymentExpiresAt <= new Date()) {
    throw ApiError.badRequest('The payment window for this order has closed');
  }
  if (!order.payment?.snapToken) {
    throw ApiError.conflict('Payment is not ready yet, please try again shortly');
  }

  return {
    order,
    snapToken: order.payment.snapToken,
    redirectUrl: order.payment.redirectUrl,
    clientKey: env.midtrans.clientKey,
  };
};

// Maps a Midtrans status response to one of our outcomes. 'unknown' (for example challenge or refund) changes nothing.
export const resolvePaymentOutcome = ({ transaction_status: status, fraud_status: fraud }) => {
  if (status === 'capture') return fraud === 'accept' ? 'paid' : 'pending';
  if (status === 'settlement') return 'paid';
  if (status === 'pending') return 'pending';
  if (['deny', 'cancel', 'failure'].includes(status)) return 'failed';
  if (status === 'expire') return 'expired';
  return 'unknown';
};

// Applies one Midtrans status response to an order. Safe to repeat: stock is restored and history is written only on the first real change.
export const applyPaymentStatus = async (orderId, statusBody) => {
  const meta = definedOnly({
    'payment.rawStatus': statusBody.transaction_status,
    'payment.transactionId': statusBody.transaction_id,
    'payment.paymentType': statusBody.payment_type,
  });
  const outcome = resolvePaymentOutcome(statusBody);

  if (outcome === 'paid') return markPaid(orderId, meta);
  if (outcome === 'failed' || outcome === 'expired') return cancelUnpaid(orderId, outcome, meta);

  if (Object.keys(meta).length) {
    await Order.updateOne({ _id: orderId }, { $set: meta });
  }
  return Order.findById(orderId);
};

const markPaid = (orderId, meta) =>
  runInTransaction(async (session) => {
    const paidAt = new Date();
    const result = await Order.updateOne(
      { _id: orderId, status: 'pending_payment', paymentStatus: { $ne: 'paid' } },
      {
        $set: { ...meta, paymentStatus: 'paid', status: 'processing', 'payment.paidAt': paidAt },
        $push: { statusHistory: { status: 'processing', changedAt: paidAt, changedBy: MIDTRANS_ACTOR } },
      },
      { session },
    );

    const current = await Order.findById(orderId).session(session);
    if (result.matchedCount === 0 && current.paymentStatus !== 'paid') {
      // The order was cancelled before the money arrived. Its stock was already returned, so we only record the fact.
      console.warn(`Payment received for cancelled order ${current.orderNumber}. Refund it manually.`);
      await Order.updateOne({ _id: orderId }, { $set: meta }, { session });
    }
    return Order.findById(orderId).session(session);
  });

const cancelUnpaid = (orderId, paymentStatus, meta) =>
  runInTransaction(async (session) => {
    const result = await Order.updateOne(
      { _id: orderId, status: 'pending_payment', paymentStatus: 'unpaid' },
      {
        $set: { ...meta, status: 'cancelled', paymentStatus },
        $push: { statusHistory: { status: 'cancelled', changedAt: new Date(), changedBy: MIDTRANS_ACTOR } },
      },
      { session },
    );

    if (result.matchedCount === 1) {
      const order = await Order.findById(orderId).session(session);
      await restoreStock(order.items, session);
    }
    return Order.findById(orderId).session(session);
  });

// Webhook entry point. The signature was already checked by the controller. The status is re-read from Midtrans here.
export const processMidtransNotification = async (orderNumber) => {
  const order = await Order.findOne({ orderNumber });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const statusBody = await getTransactionStatus(orderNumber);
  if (statusBody.order_id !== orderNumber) {
    throw ApiError.forbidden('Status does not match the order');
  }
  return applyPaymentStatus(order._id, statusBody);
};

// Customer-side fallback for local development, where Midtrans cannot reach the webhook.
export const syncMyPaymentStatus = async (userId, orderId) => {
  const order = await getMyOrder(userId, orderId);
  if (order.status !== 'pending_payment' || order.paymentStatus !== 'unpaid') {
    return order;
  }

  let statusBody;
  try {
    statusBody = await getTransactionStatus(order.orderNumber);
  } catch (err) {
    // 404 means the customer has not started a payment yet. Nothing to apply.
    if (err.httpStatusCode === 404) return order;
    throw new ApiError(502, 'Payment status could not be checked. Please try again.');
  }
  return applyPaymentStatus(order._id, statusBody);
};

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

    // Cancelling a paid order simulates a refund. No money moves in this sandbox.
    const paymentChange = nextStatus === 'cancelled' && order.paymentStatus === 'paid' ? { paymentStatus: 'refunded' } : {};

    // Compare-and-set on the current status, so two concurrent updates cannot both succeed.
    const updateResult = await Order.updateOne(
      { _id: order._id, status: order.status },
      {
        $set: { status: nextStatus, ...paymentChange },
        $push: { statusHistory: { status: nextStatus, changedAt: new Date(), changedBy: String(changedBy) } },
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
  const order = await Order.findById(orderId).populate('user', 'name email');
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  return order;
};
