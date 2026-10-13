import * as adminService from '../services/adminService.js';
import * as orderService from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getSummary = asyncHandler(async (_req, res) => {
  sendSuccess(res, await adminService.getDashboardSummary());
});

export const listOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await orderService.listOrdersAdmin(req.query);
  sendSuccess(res, orders, { meta });
});

export const getOrder = asyncHandler(async (req, res) => {
  sendSuccess(res, await orderService.getOrderAdmin(req.params.id));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.transitionOrder({
    orderId: req.params.id,
    nextStatus: req.body.status,
    changedBy: req.user._id,
  });
  sendSuccess(res, order);
});
