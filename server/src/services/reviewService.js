import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, parsePagination } from '../utils/pagination.js';
import { getActiveProductBySlug } from './productService.js';

const REVIEW_SORTS = {
  newest: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
};

// Only visible reviews count toward the product's rating. Called after every change to a review.
export const recalcProductRating = async (productId) => {
  const [row] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), isHidden: false } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        ratingAverage: row ? Math.round(row.average * 10) / 10 : 0,
        ratingCount: row?.count ?? 0,
      },
    },
  );
};

// Counts visible reviews per star, so the page can draw the distribution bars.
const ratingDistribution = async (productId) => {
  const rows = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)), isHidden: false } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) {
    distribution[row._id] = row.count;
  }
  return distribution;
};

export const listProductReviews = async (slug, query) => {
  const product = await getActiveProductBySlug(slug);
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 10 });
  const filter = { product: product._id, isHidden: false };
  const sort = REVIEW_SORTS[query.sort] ?? REVIEW_SORTS.newest;

  const [reviews, total, distribution] = await Promise.all([
    Review.find(filter).populate('user', 'name').sort(sort).skip(skip).limit(limit),
    Review.countDocuments(filter),
    ratingDistribution(product._id),
  ]);

  return {
    reviews,
    meta: { ...buildMeta({ page, limit, total }), distribution, ratingAverage: product.ratingAverage, ratingCount: product.ratingCount },
  };
};

// The signed-in customer's own review for this product, or null.
export const findMyReview = async (userId, slug) => {
  const product = await getActiveProductBySlug(slug);
  return Review.findOne({ product: product._id, user: userId });
};

// A review needs a completed order that contains the product. This is what makes the review "verified".
const findCompletedOrder = (userId, productId) =>
  Order.findOne({ user: userId, status: 'completed', 'items.product': productId }).sort({ createdAt: -1 });

export const createReview = async (userId, slug, { rating, comment }) => {
  const product = await getActiveProductBySlug(slug);

  const order = await findCompletedOrder(userId, product._id);
  if (!order) {
    throw ApiError.forbidden('Only customers with a completed order for this product can write a review');
  }

  const existing = await Review.exists({ product: product._id, user: userId });
  if (existing) {
    throw ApiError.conflict('You have already reviewed this product. You can edit or delete your review instead.');
  }

  const review = await Review.create({ product: product._id, user: userId, order: order._id, rating, comment });
  await recalcProductRating(product._id);
  return review.populate('user', 'name');
};

export const updateMyReview = async (userId, slug, data) => {
  const product = await getActiveProductBySlug(slug);
  const review = await Review.findOne({ product: product._id, user: userId });
  if (!review) {
    throw ApiError.notFound('You have not reviewed this product yet');
  }

  if (data.rating !== undefined) review.rating = data.rating;
  if (data.comment !== undefined) review.comment = data.comment;
  await review.save();
  await recalcProductRating(product._id);
  return review.populate('user', 'name');
};

export const deleteMyReview = async (userId, slug) => {
  const product = await getActiveProductBySlug(slug);
  const deleted = await Review.findOneAndDelete({ product: product._id, user: userId });
  if (!deleted) {
    throw ApiError.notFound('You have not reviewed this product yet');
  }
  await recalcProductRating(product._id);
};

// Admin moderation. visibility is 'all' by default, or 'visible' / 'hidden'.
export const listReviewsAdmin = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.visibility === 'visible') filter.isHidden = false;
  if (query.visibility === 'hidden') filter.isHidden = true;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name slug')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, meta: buildMeta({ page, limit, total }) };
};

export const setReviewVisibility = async (reviewId, isHidden) => {
  const review = await Review.findByIdAndUpdate(reviewId, { $set: { isHidden } }, { new: true })
    .populate('product', 'name slug')
    .populate('user', 'name email');
  if (!review) {
    throw ApiError.notFound('Review not found');
  }
  await recalcProductRating(review.product._id);
  return review;
};
