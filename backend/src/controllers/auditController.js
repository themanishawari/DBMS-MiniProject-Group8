import { pool } from '../config/db.js';
import { mapAuditLogRow } from '../utils/mappers.js';

/**
 * GET /api/v1/audit-logs
 * Returns audit records sorted descending (Admin only).
 */
export async function getAuditLogs(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200'
    );
    return res.json(rows.map((r) => mapAuditLogRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/audit-logs
 * Inserts an audit record.
 */
export async function addAuditLog(req, res, next) {
  try {
    const { action, entityType, entityId, details } = req.body;
    const user = req.user;

    const [result] = await pool.query(
      `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user ? user.id : req.body.userId || null,
        user ? user.role : req.body.userRole || null,
        user ? user.name : req.body.userName || null,
        action,
        entityType,
        entityId,
        typeof details === 'object' ? JSON.stringify(details) : details || null,
        req.ip || null,
      ]
    );

    const [rows] = await pool.query(
      'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [user ? user.id : req.body.userId]
    );

    return res.status(201).json(mapAuditLogRow(rows[0]));
  } catch (error) {
    next(error);
  }
}
