import * as cartService from '../services/cartService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getCart = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.getCart(req.user._id));
});

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  sendSuccess(res, await cartService.addItem({ userId: req.user._id, productId, quantity }));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  sendSuccess(res, await cartService.updateItemQuantity({ userId: req.user._id, productId, quantity }));
});

export const removeItem = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.removeItem({ userId: req.user._id, productId: req.params.productId }));
});

export const clearCart = asyncHandler(async (req, res) => {
  sendSuccess(res, await cartService.clearCart(req.user._id));
});
