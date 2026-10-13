import * as orderService from '../services/orderService.js';
import { isValidSignature } from '../services/midtransService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Midtrans Payment Notification URL. Public on purpose: the signature is the only proof of origin.
// The body is never trusted on its own. The status is re-read from Midtrans before anything changes.
export const midtransNotification = asyncHandler(async (req, res) => {
  if (!isValidSignature(req.body ?? {})) {
    return res.status(403).json({ success: false, message: 'Invalid signature' });
  }

  await orderService.processMidtransNotification(req.body.order_id);
  res.status(200).json({ success: true });
});
