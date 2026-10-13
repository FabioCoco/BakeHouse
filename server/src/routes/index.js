import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import cartRoutes from './cartRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import productRoutes from './productRoutes.js';
import userRoutes from './userRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

export default router;
