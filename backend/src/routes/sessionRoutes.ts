import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listSessionsController,
  revokeSessionController,
} from '../controllers/sessionController';

const router = Router();

router.get('/', authMiddleware, listSessionsController);
router.post('/:id/revoke', authMiddleware, revokeSessionController);

export default router;
