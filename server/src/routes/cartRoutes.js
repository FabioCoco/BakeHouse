import { Router } from 'express';
import { addItem, clearCart, getCart, removeItem, updateItem } from '../controllers/cartController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { addItemRules, productIdParam, updateItemRules } from '../validators/cart.js';

const router = Router();

router.use(protect);

router.get('/', getCart);
router.post('/items', addItemRules(), validate, addItem);
router.patch('/items/:productId', updateItemRules(), validate, updateItem);
router.delete('/items/:productId', productIdParam(), validate, removeItem);
router.delete('/', clearCart);

export default router;
