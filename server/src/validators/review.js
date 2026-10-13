import { body, param, query } from 'express-validator';

const REVIEW_SORT_OPTIONS = ['newest', 'highest'];

export const slugParam = () => param('slug').isString().trim().notEmpty().withMessage('slug is required');

export const reviewListQuery = () => [
  query('sort').optional().isIn(REVIEW_SORT_OPTIONS).withMessage(`sort must be one of: ${REVIEW_SORT_OPTIONS.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];

const ratingRule = () =>
  body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be an integer from 1 to 5').toInt();

const commentRule = () =>
  body('comment').isString().trim().isLength({ min: 10, max: 500 }).withMessage('comment must be 10 to 500 characters');

export const reviewCreateRules = () => [ratingRule(), commentRule()];

export const reviewUpdateRules = () => [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating must be an integer from 1 to 5').toInt(),
  body('comment').optional().isString().trim().isLength({ min: 10, max: 500 }).withMessage('comment must be 10 to 500 characters'),
  body().custom((value) => {
    if (value.rating === undefined && value.comment === undefined) {
      throw new Error('Provide rating or comment');
    }
    return true;
  }),
];

export const adminReviewListQuery = () => [
  query('visibility').optional().isIn(['all', 'visible', 'hidden']).withMessage('visibility must be all, visible, or hidden'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];

export const visibilityRules = () => [body('isHidden').isBoolean().withMessage('isHidden must be a boolean').toBoolean()];
