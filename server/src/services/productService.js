import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';
import { onSaleFilter } from '../utils/pricing.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
  discount: { discountPercent: -1, createdAt: -1 },
};

const CATEGORY_FIELDS = 'name slug';

const ensureCategoryExists = async (categoryId) => {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) {
    throw ApiError.badRequest('Category not found', [{ field: 'category', message: 'Category not found' }]);
  }
};

export const listProducts = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { isActive: true };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.category) {
    const category = await Category.findOne({ slug: query.category }).select('_id');
    if (!category) {
      return { products: [], meta: buildMeta({ page, limit, total: 0 }) };
    }
    filter.category = category._id;
  }

  if (query.origin) {
    filter.origin = query.origin;
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  if (query.inStock === true) {
    filter.stock = { $gt: 0 };
  }

  if (query.onSale === true) {
    Object.assign(filter, onSaleFilter());
  }

  const sort = SORT_OPTIONS[query.sort] ?? SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', CATEGORY_FIELDS).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  return { products, meta: buildMeta({ page, limit, total }) };
};

// Public lookup: soft-deleted products are hidden here too.
export const getActiveProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug, isActive: true }).populate('category', CATEGORY_FIELDS);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
};

export const createProduct = async (data) => {
  await ensureCategoryExists(data.category);
  return Product.create({ ...data, slug: slugify(data.name) });
};

export const updateProduct = async (id, data) => {
  const product = await Product.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (data.category) {
    await ensureCategoryExists(data.category);
  }
  if (data.name && data.name !== product.name) {
    product.slug = slugify(data.name);
  }

  Object.assign(product, data);

  // A partial update can change only one date, so the pair is checked against the stored values.
  if (product.discountStartsAt && product.discountEndsAt && product.discountEndsAt <= product.discountStartsAt) {
    throw ApiError.badRequest('Validation failed', [
      { field: 'discountEndsAt', message: 'discountEndsAt must be after discountStartsAt' },
    ]);
  }
  return product.save();
};

// Stock is never set through the general update. It goes through this function only.
export const adjustStock = async (id, { stock, adjustment }) => {
  if (stock !== undefined) {
    const product = await Product.findByIdAndUpdate(id, { $set: { stock } }, { new: true, runValidators: true });
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  // Negative adjustments only apply if the result stays >= 0. Otherwise nothing changes.
  const filter = adjustment < 0 ? { _id: id, stock: { $gte: -adjustment } } : { _id: id };
  const product = await Product.findOneAndUpdate(filter, { $inc: { stock: adjustment } }, { new: true });

  if (!product) {
    const exists = await Product.exists({ _id: id });
    if (!exists) throw ApiError.notFound('Product not found');
    throw ApiError.conflict('Stock cannot go below zero');
  }
  return product;
};

// Soft delete: old orders keep referencing the product.
export const deactivateProduct = async (id) => {
  const product = await Product.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
};
