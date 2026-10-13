import { Router } from 'express';
import { midtransNotification } from '../controllers/paymentController.js';

const router = Router();

// No auth: Midtrans calls this endpoint directly. See the controller for how the request is verified.
router.post('/midtrans/notification', midtransNotification);

export default router;
