import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createIncomeSchema,
  updateIncomeSchema,
} from '../schemas/incomeSchemas';
import {
  getAllController,
  getByIdController,
  createController,
  updateController,
  deleteController,
} from '../controllers/incomeController';

const router = Router();

router.get('/', authMiddleware, getAllController);
router.get('/:id', authMiddleware, getByIdController);
router.post(
  '/',
  authMiddleware,
  validate(createIncomeSchema),
  createController
);
router.patch(
  '/:id',
  authMiddleware,
  validate(updateIncomeSchema),
  updateController
);
router.delete('/:id', authMiddleware, deleteController);

export default router;
