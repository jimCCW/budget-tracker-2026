import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getNotificationsController,
  getUnreadCountController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
} from '../controllers/notificationController';

const router = Router();

router.get('/', authMiddleware, getNotificationsController);
router.get('/unread-count', authMiddleware, getUnreadCountController);
router.patch('/:id/read', authMiddleware, markAsReadController);
router.post('/read-all', authMiddleware, markAllAsReadController);
router.delete('/:id', authMiddleware, deleteNotificationController);

export default router;
