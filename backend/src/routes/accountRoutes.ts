import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createAccountSchema,
  updateAccountSchema,
} from '../schemas/accountSchemas';
import {
  getSummaryController,
  getAllController,
  createController,
  updateController,
  deleteController,
} from '../controllers/accountController';

const router = Router();

// /summary must be registered before /:id to prevent route shadowing
router.get('/summary', authMiddleware, getSummaryController);
router.get('/', authMiddleware, getAllController);
router.post(
  '/',
  authMiddleware,
  validate(createAccountSchema),
  createController
);
router.patch(
  '/:id',
  authMiddleware,
  validate(updateAccountSchema),
  updateController
);
router.delete('/:id', authMiddleware, deleteController);

export default router;
