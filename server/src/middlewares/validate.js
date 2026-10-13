import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Place after the express-validator chains of a route.
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
  return next(ApiError.badRequest('Validation failed', errors));
};
