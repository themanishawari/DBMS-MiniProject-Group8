import { pool } from '../config/db.js';
import { mapNotificationRow } from '../utils/mappers.js';

/**
 * GET /api/v1/notifications?userId=:id
 * Returns in-app notifications for the user.
 */
export async function getNotifications(req, res, next) {
  try {
    const userId = req.query.userId || (req.user ? req.user.id : null);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    return res.json(rows.map((r) => mapNotificationRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/notifications
 * Creates an in-app notification.
 */
export async function createNotification(req, res, next) {
  try {
    const { userId, title, message, type, complaintId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ success: false, message: 'userId, title, and message are required.' });
    }

    await pool.query(
      `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, FALSE, NOW())`,
      [userId, title.trim(), message.trim(), type || 'system', complaintId || null]
    );

    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    return res.status(201).json(mapNotificationRow(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/notifications/:id/read
 * Marks a notification as read.
 */
export async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/notifications/read-all?userId=:id
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const userId = req.query.userId || (req.user ? req.user.id : null);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}
