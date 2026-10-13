import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../controllers/categoryController.js';
import { authorize } from '../middlewares/authorize.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { categoryRules } from '../validators/category.js';
import { idParam } from '../validators/common.js';

const router = Router();

const adminOnly = [protect, authorize('admin')];

router.get('/', listCategories);
router.post('/', ...adminOnly, categoryRules(), validate, createCategory);
router.patch('/:id', ...adminOnly, idParam(), categoryRules({ partial: true }), validate, updateCategory);
router.delete('/:id', ...adminOnly, idParam(), validate, deleteCategory);

export default router;
