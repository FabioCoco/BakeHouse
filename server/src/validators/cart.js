import { body, param } from 'express-validator';

const MAX_QUANTITY = 99;

const quantityRule = () =>
  body('quantity')
    .isInt({ min: 1, max: MAX_QUANTITY })
    .withMessage(`quantity must be an integer between 1 and ${MAX_QUANTITY}`)
    .toInt();

export const addItemRules = () => [
  body('productId').isMongoId().withMessage('productId must be a valid id'),
  quantityRule(),
];

export const updateItemRules = () => [
  param('productId').isMongoId().withMessage('productId must be a valid id'),
  quantityRule(),
];

export const productIdParam = () => param('productId').isMongoId().withMessage('productId must be a valid id');
