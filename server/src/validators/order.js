import { body, query } from 'express-validator';
import { ORDER_STATUSES } from '../models/Order.js';
import { checkoutAddressRules } from './address.js';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export const checkoutRules = () => [
  // Not marked optional, so the "one of the two" rule also runs when both are missing.
  body('addressId').custom((value, { req }) => {
    if (value === undefined && req.body.address === undefined) {
      throw new Error('Provide either addressId or address');
    }
    if (value !== undefined && !OBJECT_ID.test(String(value))) {
      throw new Error('addressId must be a valid id');
    }
    return true;
  }),
  body('address').optional().isObject({ strict: true }).withMessage('address must be an object'),
  ...checkoutAddressRules(),
  body('paymentNote')
    .optional({ values: 'null' })
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('paymentNote must be at most 200 characters'),
];

export const adminOrderListQuery = () => [
  query('status').optional().isIn(ORDER_STATUSES).withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
  query('search').optional().isString().trim().isLength({ max: 40 }).withMessage('search is too long'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];

export const orderStatusRules = () => [
  body('status').isIn(ORDER_STATUSES).withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];
