import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

// Discount fields are needed so the effectivePrice virtual can be computed.
const PRODUCT_FIELDS = 'name slug price images stock isActive discountPercent discountStartsAt discountEndsAt';

export const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { items: [] } },
    { upsert: true, new: true },
  );

// Carts written before the atomic add could hold several lines for one product. Merge them once and save.
const mergeDuplicateLines = async (cart) => {
  const byProduct = new Map();
  for (const item of cart.items) {
    const key = String(item.product);
    const entry = byProduct.get(key);
    if (entry) entry.quantity += item.quantity;
    else byProduct.set(key, { product: item.product, quantity: item.quantity });
  }
  if (byProduct.size !== cart.items.length) {
    cart.items = [...byProduct.values()];
    await cart.save();
  }
  return cart;
};

const findPopulatedCart = async (userId) => {
  const cart = await mergeDuplicateLines(await getOrCreateCart(userId));
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

    // The discounted price is what the customer pays, so totals use it.
    const lineTotal = product && product.isActive ? product.effectivePrice * item.quantity : 0;
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

// Adds one line, or increases the existing line. Each write is a single atomic update, so parallel clicks
// on "add to cart" never create two lines for the same product.
const writeLine = async (userId, productId, quantity, attempt = 0) => {
  const existing = await Cart.exists({ user: userId, 'items.product': productId });

  try {
    if (existing) {
      await Cart.updateOne({ user: userId, 'items.product': productId }, { $inc: { 'items.$.quantity': quantity } });
    } else {
      // Matches only when no line for this product exists yet. If a parallel request has just created one, this
      // would try to insert a second cart for the user, and the unique index rejects it. The retry then takes the branch above.
      await Cart.updateOne(
        { user: userId, 'items.product': { $ne: productId } },
        { $push: { items: { product: productId, quantity } } },
        { upsert: true },
      );
    }
  } catch (err) {
    if (err.code === 11000 && attempt < 3) {
      return writeLine(userId, productId, quantity, attempt + 1);
    }
    throw err;
  }
};

export const addItem = async ({ userId, productId, quantity }) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  await getOrCreateCart(userId);
  const cart = await Cart.findOne({ user: userId, 'items.product': productId }, { 'items.$': 1 }).lean();
  const currentQuantity = cart?.items?.[0]?.quantity ?? 0;
  const newQuantity = currentQuantity + quantity;

  if (newQuantity > product.stock) {
    throw ApiError.conflict(`Only ${product.stock} of "${product.name}" available`, [
      { product: product._id, name: product.name, available: product.stock },
    ]);
  }

  await writeLine(userId, productId, quantity);
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
