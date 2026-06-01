import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
  createRuleSchema,
  updateRuleSchema,
  setActiveSchema,
} from '../schemas/recurringSchemas';
import {
  getAllController,
  getByIdController,
  createController,
  updateController,
  setActiveController,
  deleteController,
  catchupController,
} from '../controllers/recurringController';

const router = Router();

router.post('/catchup', authMiddleware, catchupController);
router.get('/', authMiddleware, getAllController);
router.get('/:id', authMiddleware, getByIdController);
router.post('/', authMiddleware, validate(createRuleSchema), createController);
router.patch(
  '/:id',
  authMiddleware,
  validate(updateRuleSchema),
  updateController
);
router.patch(
  '/:id/active',
  authMiddleware,
  validate(setActiveSchema),
  setActiveController
);
router.delete('/:id', authMiddleware, deleteController);

export default router;
