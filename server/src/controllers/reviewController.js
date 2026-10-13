import * as reviewService from '../services/reviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.listProductReviews(req.params.slug, req.query);
  sendSuccess(res, reviews, { meta });
});

export const getMyReview = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.findMyReview(req.user._id, req.params.slug));
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.params.slug, req.body);
  sendSuccess(res, review, { statusCode: 201 });
});

export const updateReview = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.updateMyReview(req.user._id, req.params.slug, req.body));
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteMyReview(req.user._id, req.params.slug);
  sendSuccess(res, { message: 'Review deleted' });
});

export const listReviewsAdmin = asyncHandler(async (req, res) => {
  const { reviews, meta } = await reviewService.listReviewsAdmin(req.query);
  sendSuccess(res, reviews, { meta });
});

export const setReviewVisibility = asyncHandler(async (req, res) => {
  sendSuccess(res, await reviewService.setReviewVisibility(req.params.id, req.body.isHidden));
});
