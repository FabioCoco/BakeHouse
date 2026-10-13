import { ApiError } from '../utils/ApiError.js';

// Role-based access control. Must run after `protect`.
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }

  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden());
  }

  next();
};
