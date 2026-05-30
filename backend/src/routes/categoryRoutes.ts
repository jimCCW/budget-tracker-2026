import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/categorySchemas';
import {
  getAllController,
  createController,
  updateController,
  deleteController,
} from '../controllers/categoryController';

const router = Router();

router.get('/', authMiddleware, getAllController);
router.post(
  '/',
  authMiddleware,
  validate(createCategorySchema),
  createController
);
router.patch(
  '/:id',
  authMiddleware,
  validate(updateCategorySchema),
  updateController
);
router.delete('/:id', authMiddleware, deleteController);

export default router;
