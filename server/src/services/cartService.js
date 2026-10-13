import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

const PRODUCT_FIELDS = 'name slug price images stock isActive';

export const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true },
  );

const findPopulatedCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  return cart.populate({ path: 'items.product', select: PRODUCT_FIELDS });
};

// Computes totals on the server and flags lines that cannot be bought as they are now.
const toCartView = (cart) => {
  let subtotal = 0;
  let itemCount = 0;
  let hasIssues = false;

  const items = cart.items.map((item) => {
    const product = item.product;
    const issues = [];

    if (!product || !product.isActive) {
      issues.push('unavailable');
    } else if (product.stock < item.quantity) {
      issues.push('insufficient_stock');
    }

    if (issues.length) hasIssues = true;

    const lineTotal = product && product.isActive ? product.price * item.quantity : 0;
    subtotal += lineTotal;
    itemCount += item.quantity;

    return {
      product: product ?? null,
      quantity: item.quantity,
      lineTotal,
      issues,
    };
  });

  return { items, itemCount, subtotal, hasIssues };
};

export const getCart = async (userId) => toCartView(await findPopulatedCart(userId));

export const addItem = async ({ userId, productId, quantity }) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.product) === String(productId));
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  if (newQuantity > product.stock) {
    throw ApiError.conflict(`Only ${product.stock} of "${product.name}" available`, [
      { product: product._id, name: product.name, available: product.stock },
    ]);
  }

  if (existing) {
    existing.quantity = newQuantity;
  } else {
    cart.items.push({ product: product._id, quantity });
  }
  await cart.save();

  return getCart(userId);
};

export const updateItemQuantity = async ({ userId, productId, quantity }) => {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((line) => String(line.product) === String(productId));
  if (!item) {
    throw ApiError.notFound('Item is not in your cart');
  }

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw ApiError.conflict('Product is no longer available');
  }

  if (quantity > product.stock) {
    throw ApiError.conflict(`Only ${product.stock} of "${product.name}" available`, [
      { product: product._id, name: product.name, available: product.stock },
    ]);
  }

  item.quantity = quantity;
  await cart.save();

  return getCart(userId);
};

export const removeItem = async ({ userId, productId }) => {
  await Cart.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
  return getCart(userId);
};

export const clearCart = async (userId) => {
  await Cart.updateOne({ user: userId }, { $set: { items: [] } }, { upsert: true });
  return getCart(userId);
};
