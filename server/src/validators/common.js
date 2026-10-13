import { param, query } from 'express-validator';

export const idParam = (name = 'id') =>
  param(name).isMongoId().withMessage(`${name} must be a valid id`);

export const paginationQuery = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50').toInt(),
];
