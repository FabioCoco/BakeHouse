import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  updateStock,
} from '../controllers/productController.js';
import { createReview, deleteReview, getMyReview, listProductReviews, updateReview } from '../controllers/reviewController.js';
import { protect } from '../middlewares/auth.js';
import { reviewCreateRules, reviewListQuery, reviewUpdateRules, slugParam } from '../validators/review.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import { productCreateRules, productListQuery, productRules, stockRules } from '../validators/product.js';

const router = Router();

const adminOnly = [protect, authorize('admin')];

router.get('/', productListQuery(), validate, listProducts);
router.get('/:slug', getProduct);

// Reviews. Reading is public. Writing needs a signed-in customer with a completed order for the product.
router.get('/:slug/reviews', reviewListQuery(), validate, listProductReviews);
router.get('/:slug/reviews/me', protect, slugParam(), validate, getMyReview);
router.post('/:slug/reviews', protect, slugParam(), reviewCreateRules(), validate, createReview);
router.patch('/:slug/reviews', protect, slugParam(), reviewUpdateRules(), validate, updateReview);
router.delete('/:slug/reviews', protect, slugParam(), validate, deleteReview);

router.post('/', ...adminOnly, productCreateRules(), validate, createProduct);
router.patch('/:id/stock', ...adminOnly, idParam(), stockRules(), validate, updateStock);
router.patch('/:id', ...adminOnly, idParam(), productRules({ partial: true }), validate, updateProduct);
router.delete('/:id', ...adminOnly, idParam(), validate, deleteProduct);

export default router;
