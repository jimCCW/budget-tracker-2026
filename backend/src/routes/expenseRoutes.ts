import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from '../schemas/expenseSchemas';
import {
  getAllController,
  getByIdController,
  createController,
  updateController,
  deleteController,
} from '../controllers/expenseController';

const router = Router();

router.get('/', authMiddleware, getAllController);
router.get('/:id', authMiddleware, getByIdController);
router.post(
  '/',
  authMiddleware,
  validate(createExpenseSchema),
  createController
);
router.patch(
  '/:id',
  authMiddleware,
  validate(updateExpenseSchema),
  updateController
);
router.delete('/:id', authMiddleware, deleteController);

export default router;
