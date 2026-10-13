import { body, query } from 'express-validator';
import { PRODUCT_ORIGINS } from '../models/Product.js';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name', 'discount'];

export const productListQuery = () => [
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('search is too long'),
  query('category').optional().isString().trim().toLowerCase(),
  query('origin').optional().isIn(PRODUCT_ORIGINS).withMessage(`origin must be one of: ${PRODUCT_ORIGINS.join(', ')}`),
  // minPrice and maxPrice compare the list price, not the discounted one.
  query('minPrice').optional().isInt({ min: 0 }).withMessage('minPrice must be a non-negative integer').toInt(),
  query('maxPrice').optional().isInt({ min: 0 }).withMessage('maxPrice must be a non-negative integer').toInt(),
  query('inStock').optional().isIn(['true', 'false']).withMessage('inStock must be true or false').toBoolean(),
  query('onSale').optional().isIn(['true', 'false']).withMessage('onSale must be true or false').toBoolean(),
  query('sort').optional().isIn(PRODUCT_SORTS).withMessage(`sort must be one of: ${PRODUCT_SORTS.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];

const imageFilename = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|avif)$/i;

export const productRules = ({ partial = false } = {}) => {
  const field = (name) => (partial ? body(name).optional() : body(name));

  return [
    field('name').isString().trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
    field('description').isString().trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
    field('price').isInt({ min: 0 }).withMessage('Price must be a non-negative integer (Rupiah)').toInt(),
    field('category').isMongoId().withMessage('category must be a valid id'),
    field('origin').optional().isIn(PRODUCT_ORIGINS).withMessage(`origin must be one of: ${PRODUCT_ORIGINS.join(', ')}`),
    field('images')
      .optional()
      .isArray({ max: 10 })
      .withMessage('images must be an array of up to 10 filenames'),
    field('images.*')
      .isString()
      .matches(imageFilename)
      .withMessage('Each image must be a filename such as "croissant.jpg"'),
    field('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
    // Discount fields accept null so an admin can clear a date. Partial updates may omit them.
    body('discountPercent')
      .optional({ values: 'null' })
      .isInt({ min: 0, max: 90 })
      .withMessage('discountPercent must be an integer from 0 to 90')
      .toInt(),
    body('discountStartsAt')
      .optional({ values: 'null' })
      .isISO8601()
      .withMessage('discountStartsAt must be a valid date')
      .toDate(),
    body('discountEndsAt')
      .optional({ values: 'null' })
      .isISO8601()
      .withMessage('discountEndsAt must be a valid date')
      .toDate()
      .custom((end, { req }) => {
        const start = req.body.discountStartsAt;
        if (end && start && new Date(end) <= new Date(start)) {
          throw new Error('discountEndsAt must be after discountStartsAt');
        }
        return true;
      }),
  ];
};

// Create-only: stock is set at creation. Afterwards it changes only via PATCH /products/:id/stock.
export const productCreateRules = () => [
  ...productRules(),
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be a non-negative integer').toInt(),
];

export const stockRules = () => [
  body('stock').optional().isInt({ min: 0 }).withMessage('stock must be a non-negative integer').toInt(),
  body('adjustment').optional().isInt().withMessage('adjustment must be an integer').toInt(),
  body().custom((value) => {
    const hasStock = value.stock !== undefined;
    const hasAdjustment = value.adjustment !== undefined;
    if (hasStock === hasAdjustment) {
      throw new Error('Provide exactly one of "stock" (absolute) or "adjustment" (relative)');
    }
    return true;
  }),
];
