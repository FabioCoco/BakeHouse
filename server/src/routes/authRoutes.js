import { Router } from 'express';
import { googleLogin, login, logout, me, register } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { authRateLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { googleRules, loginRules, registerRules } from '../validators/auth.js';

const router = Router();

router.use(authRateLimiter);

router.post('/register', registerRules(), validate, register);
router.post('/login', loginRules(), validate, login);
router.post('/google', googleRules(), validate, googleLogin);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
