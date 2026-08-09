import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../schemas/userSchemas';
import {
  getMeController,
  updateMeController,
  changePasswordController,
  deleteAccountController,
} from '../controllers/userController';

const router = Router();

router.get('/me', authMiddleware, getMeController);
router.patch(
  '/me',
  authMiddleware,
  validate(updateProfileSchema),
  updateMeController
);
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  changePasswordController
);
router.delete(
  '/me',
  authMiddleware,
  validate(deleteAccountSchema),
  deleteAccountController
);

export default router;
