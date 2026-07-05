import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getSummaryController,
  getTrendController,
} from '../controllers/dashboardController';

const router = Router();

router.get('/summary', authMiddleware, getSummaryController);
router.get('/trend', authMiddleware, getTrendController);

export default router;
