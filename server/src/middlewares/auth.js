import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

// Reads the JWT from the httpOnly cookie and attaches the matching user to req.user.
export const protect = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[env.cookie.name];
  if (!token) {
    throw ApiError.unauthorized();
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session is invalid or expired');
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = user;
  next();
});
