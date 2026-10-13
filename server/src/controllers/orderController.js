import * as orderService from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { env } from '../config/env.js';

// Bank details returned with every checkout so the customer knows where to transfer.
const bankAccountInfo = () => ({ ...env.bankAccount });

export const checkout = asyncHandler(async (req, res) => {
  const { addressId, address, paymentNote } = req.body;
  const order = await orderService.checkout({ userId: req.user._id, addressId, address, paymentNote });

  sendSuccess(res, { order, payment: bankAccountInfo() }, { statusCode: 201 });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.listMyOrders(req.user._id, req.query);
  sendSuccess(res, orders, { meta });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.getMyOrder(req.user._id, req.params.id));
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.transitionOrder({
    orderId: req.params.id,
    nextStatus: 'cancelled',
    changedBy: req.user._id,
    ownerId: req.user._id,
    allowedFrom: ['pending_confirmation'],
  });
  sendSuccess(res, order);
});
