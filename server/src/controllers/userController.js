import * as profileService from '../services/profileService.js';
import * as userService from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile(req.user._id, req.body);
  sendSuccess(res, user);
});

export const changePassword = asyncHandler(async (req, res) => {
  await profileService.changePassword(req.user._id, req.body);
  sendSuccess(res, { message: 'Password updated' });
});

export const listAddresses = asyncHandler(async (req, res) => {
  sendSuccess(res, userService.listAddresses(req.user));
});

export const addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddress(req.user, req.body);
  sendSuccess(res, addresses, { statusCode: 201 });
});

export const updateAddress = asyncHandler(async (req, res) => {
  sendSuccess(res, await userService.updateAddress(req.user, req.params.addressId, req.body));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  sendSuccess(res, await userService.deleteAddress(req.user, req.params.addressId));
});
