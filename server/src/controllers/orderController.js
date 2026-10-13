import * as orderService from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// The client opens Snap with snapToken. The order is returned so the page can show it right away.
export const checkout = asyncHandler(async (req, res) => {
  const { addressId, address, paymentNote } = req.body;
  const result = await orderService.checkout({ userId: req.user._id, addressId, address, paymentNote });

  sendSuccess(res, result, { statusCode: 201 });
});

// Resumes payment for an unpaid order by returning the existing Snap token.
export const payOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.payOrder(req.user._id, req.params.id));
});

// Local-development fallback: asks Midtrans for the live status and applies it.
export const syncPaymentStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.syncMyPaymentStatus(req.user._id, req.params.id));
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
    allowedFrom: ['pending_payment'],
  });
  sendSuccess(res, order);
});
