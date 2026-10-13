import { Router } from 'express';
import {
  addAddress,
  changePassword,
  deleteAddress,
  listAddresses,
  updateAddress,
  updateProfile,
} from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { addressRules } from '../validators/address.js';
import { idParam } from '../validators/common.js';
import { passwordChangeRules, profileRules } from '../validators/profile.js';

const router = Router();

router.use(protect);

const addressIdParam = () => idParam('addressId');

router.patch('/me', profileRules(), validate, updateProfile);
router.patch('/me/password', passwordChangeRules(), validate, changePassword);

router.get('/me/addresses', listAddresses);
router.post('/me/addresses', addressRules(), validate, addAddress);
router.patch('/me/addresses/:addressId', addressIdParam(), addressRules({ partial: true }), validate, updateAddress);
router.delete('/me/addresses/:addressId', addressIdParam(), validate, deleteAddress);

export default router;
