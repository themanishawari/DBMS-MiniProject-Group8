import { pool } from '../config/db.js';
import { mapCommentRow } from '../utils/mappers.js';

/**
 * GET /api/v1/complaints/:id/comments
 * Returns comment thread. Hides internal staff notes from students.
 */
export async function getComments(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    let query = `
      SELECT c.*, u.full_name AS user_name, u.role_id AS user_role
      FROM complaint_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.complaint_id = ?
    `;
    const params = [id];

    // If student, hide internal staff notes
    if (user && user.role === 'student') {
      query += ' AND c.is_internal = FALSE';
    }

    query += ' ORDER BY c.created_at ASC';

    const [rows] = await pool.query(query, params);
    return res.json(rows.map((r) => mapCommentRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/complaints/:id/comments
 * Adds public comment or internal staff note.
 */
export async function addComment(req, res, next) {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;
    const user = req.user;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
    }

    const userId = user ? user.id : req.body.userId;
    const internalFlag = Boolean(isInternal);

    if (internalFlag && user && user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students cannot post internal staff notes.' });
    }

    // Insert comment
    await pool.query(
      `INSERT INTO complaint_comments (complaint_id, user_id, content, is_internal, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, userId, content.trim(), internalFlag]
    );

    // Fetch complaint to notify other party
    const [compRows] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (compRows.length > 0 && !internalFlag) {
      const complaint = compRows[0];
      if (user && user.role === 'student') {
        if (complaint.assigned_staff_id) {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id)
             VALUES (?, ?, ?, 'comment', ?)`,
            [
              complaint.assigned_staff_id,
              `New Student Comment on ${id}`,
              `${user.name}: "${content.substring(0, 60)}..."`,
              id,
            ]
          );
        }
      } else if (user) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id)
           VALUES (?, ?, ?, 'comment', ?)`,
          [
            complaint.student_id,
            `New Comment on ${id}`,
            `${user.name} (${user.role.toUpperCase()}): "${content.substring(0, 60)}..."`,
            id,
          ]
        );
      }
    }

    // Return newly created comment
    const [newCommentRows] = await pool.query(
      `SELECT c.*, u.full_name AS user_name, u.role_id AS user_role
       FROM complaint_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id = ?
       ORDER BY c.created_at DESC LIMIT 1`,
      [id]
    );

    return res.status(201).json(mapCommentRow(newCommentRows[0]));
  } catch (error) {
    next(error);
  }
}
