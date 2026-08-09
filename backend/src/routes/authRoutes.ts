import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  activateSchema,
  resendSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/authSchemas';
import {
  registerController,
  activateController,
  resendController,
  loginController,
  logoutController,
  forgotPasswordController,
  verifyResetTokenController,
  resetPasswordController,
} from '../controllers/authController';

const router = Router();

router.post('/register', validate(registerSchema), registerController);
router.post('/activate', validate(activateSchema), activateController);
router.post('/resend', validate(resendSchema), resendController);
router.post('/login', validate(loginSchema), loginController);
router.post('/logout', authMiddleware, logoutController);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  forgotPasswordController
);
router.get('/verify-reset-token', verifyResetTokenController);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  resetPasswordController
);

export default router;
