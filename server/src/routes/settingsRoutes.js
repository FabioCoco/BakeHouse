import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';

const router = Router();

// Public: the storefront reads the announcement, banners, and featured categories from here.
router.get('/', getPublicSettings);

export default router;
