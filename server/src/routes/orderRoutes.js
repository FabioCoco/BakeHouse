import { Router } from 'express';
import {
  cancelMyOrder,
  checkout,
  getMyOrder,
  listMyOrders,
  payOrder,
  syncPaymentStatus,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { idParam, paginationQuery } from '../validators/common.js';
import { checkoutRules } from '../validators/order.js';

const router = Router();

router.use(protect);

router.post('/checkout', checkoutRules(), validate, checkout);
router.get('/me', paginationQuery(), validate, listMyOrders);
router.get('/me/:id', idParam(), validate, getMyOrder);
router.post('/me/:id/pay', idParam(), validate, payOrder);
router.get('/me/:id/payment-status', idParam(), validate, syncPaymentStatus);
router.patch('/me/:id/cancel', idParam(), validate, cancelMyOrder);

export default router;
