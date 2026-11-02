import { Router } from 'express';
import {
  createNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', getNotifications);
router.post('/', createNotification);
router.post('/read-all', markAllNotificationsAsRead);
router.post('/:id/read', markNotificationAsRead);

export default router;
