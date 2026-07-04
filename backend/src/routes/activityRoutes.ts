import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getActivityController,
  exportActivityController,
} from '../controllers/activityController';

const router = Router();

router.get('/', authMiddleware, getActivityController);
router.get('/export', authMiddleware, exportActivityController);

export default router;
