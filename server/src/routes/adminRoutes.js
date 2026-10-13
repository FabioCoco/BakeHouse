import { Router } from 'express';
import { getOrder, getSummary, listOrders, updateOrderStatus } from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { listReviewsAdmin, setReviewVisibility } from '../controllers/reviewController.js';
import { getAdminSettings, getAnalytics, updateAdminSettings } from '../controllers/settingsController.js';
import { uploadImage as uploadImageController } from '../controllers/uploadController.js';
import { uploadImage } from '../middlewares/upload.js';
import { analyticsQuery, settingsRules } from '../validators/settings.js';
import { idParam } from '../validators/common.js';
import { adminReviewListQuery, visibilityRules } from '../validators/review.js';
import { adminOrderListQuery, orderStatusRules } from '../validators/order.js';

const router = Router();

// Every route in this file requires an authenticated admin.
router.use(protect, authorize('admin'));

router.get('/summary', getSummary);
router.get('/orders', adminOrderListQuery(), validate, listOrders);
router.get('/orders/:id', idParam(), validate, getOrder);
router.patch('/orders/:id/status', idParam(), orderStatusRules(), validate, updateOrderStatus);

// Image upload for product photos and banners. Admin only, via the router-level authorize above.
router.post('/uploads', uploadImage, uploadImageController);

router.get('/settings', getAdminSettings);
router.put('/settings', settingsRules(), validate, updateAdminSettings);
router.get('/analytics', analyticsQuery(), validate, getAnalytics);

router.get('/reviews', adminReviewListQuery(), validate, listReviewsAdmin);
router.patch('/reviews/:id/visibility', idParam(), visibilityRules(), validate, setReviewVisibility);

export default router;
