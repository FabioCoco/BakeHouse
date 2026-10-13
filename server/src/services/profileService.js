import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

// Updates the display name and phone. Email is not changed here.
export const updateProfile = async (userId, { name, phone }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone ?? '';
  await user.save();
  return user;
};

// Changes the password after checking the current one. Google-only accounts have no password to change.
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  if (!user.password) {
    throw ApiError.badRequest('This account signs in with Google and has no password to change');
  }

  const valid = await user.comparePassword(currentPassword);
  if (!valid) {
    throw ApiError.badRequest('Validation failed', [{ field: 'currentPassword', message: 'Current password is incorrect' }]);
  }
  if (currentPassword === newPassword) {
    throw ApiError.badRequest('Validation failed', [{ field: 'newPassword', message: 'New password must be different' }]);
  }

  user.password = newPassword;
  await user.save();
};
