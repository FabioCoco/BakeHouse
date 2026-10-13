import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
  updateStock,
} from '../controllers/productController.js';
import { protect } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { idParam } from '../validators/common.js';
import { productCreateRules, productListQuery, productRules, stockRules } from '../validators/product.js';

const router = Router();

const adminOnly = [protect, authorize('admin')];

router.get('/', productListQuery(), validate, listProducts);
router.get('/:slug', getProduct);

router.post('/', ...adminOnly, productCreateRules(), validate, createProduct);
router.patch('/:id/stock', ...adminOnly, idParam(), stockRules(), validate, updateStock);
router.patch('/:id', ...adminOnly, idParam(), productRules({ partial: true }), validate, updateProduct);
router.delete('/:id', ...adminOnly, idParam(), validate, deleteProduct);

export default router;
