import { withTransaction } from '../config/db.js';
import { mapFeedbackRow } from '../utils/mappers.js';

/**
 * POST /api/v1/complaints/:id/feedback
 * Submits student satisfaction feedback and closes the complaint.
 */
export async function submitFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comments } = req.body;
    const user = req.user;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const studentId = user ? user.id : req.body.studentId;

    const feedback = await withTransaction(async (conn) => {
      const [compRows] = await conn.query('SELECT * FROM complaints WHERE id = ?', [id]);
      if (compRows.length === 0) throw new Error('Complaint not found.');
      const complaint = compRows[0];

      if (user && user.role === 'student' && complaint.student_id !== user.id) {
        throw new Error('Access denied: You can only submit feedback for your own complaints.');
      }

      if (complaint.status !== 'resolved') {
        throw new Error('Feedback can only be submitted for complaints in "resolved" status.');
      }

      // Check for duplicate feedback
      const [existing] = await conn.query('SELECT id FROM complaint_feedback WHERE complaint_id = ?', [id]);
      if (existing.length > 0) {
        throw new Error('Feedback has already been submitted for this complaint.');
      }

      // Insert feedback
      await conn.query(
        `INSERT INTO complaint_feedback (complaint_id, student_id, rating, comments, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [id, studentId, numRating, comments ? comments.trim() : null]
      );

      // Close the complaint
      await conn.query(
        'UPDATE complaints SET status = "closed", updated_at = NOW() WHERE id = ?',
        [id]
      );

      // Status history entry
      await conn.query(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by_id, remarks)
         VALUES (?, 'resolved', 'closed', ?, ?)`,
        [
          id,
          studentId,
          `Resolution accepted by student with ${numRating}★ rating: "${comments || 'No remarks'}"`,
        ]
      );

      // Audit log
      await conn.query(
        `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
         VALUES (?, 'student', ?, 'FEEDBACK_SUBMITTED', 'complaint', ?, ?)`,
        [
          studentId,
          user ? user.name : 'Student',
          id,
          JSON.stringify({ rating: numRating, comments }),
        ]
      );

      const [fbRows] = await conn.query('SELECT * FROM complaint_feedback WHERE complaint_id = ?', [id]);
      return mapFeedbackRow(fbRows[0]);
    });

    return res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
}
