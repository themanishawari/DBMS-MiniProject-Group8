import { pool, withTransaction } from '../config/db.js';
import { mapSLARuleRow } from '../utils/mappers.js';

/**
 * GET /api/v1/sla-rules
 * Returns SLA rules matrix ordered by priority.
 */
export async function getSLARules(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM escalation_rules ORDER BY FIELD(priority, 'critical', 'high', 'medium', 'low')"
    );
    return res.json(rows.map((r) => mapSLARuleRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/sla-rules
 * Updates SLA threshold configuration (Admin only).
 */
export async function updateSLARules(req, res, next) {
  try {
    const rules = req.body;
    const user = req.user;

    if (!Array.isArray(rules)) {
      return res.status(400).json({ success: false, message: 'Expected an array of SLA rules.' });
    }

    await withTransaction(async (conn) => {
      for (const rule of rules) {
        await conn.query(
          `UPDATE escalation_rules 
           SET acknowledgement_target_hours = ?, 
               resolution_target_hours = ?, 
               escalation_threshold_hours = ?, 
               auto_escalate = ?
           WHERE priority = ?`,
          [
            Number(rule.acknowledgementTargetHours) || 24,
            Number(rule.resolutionTargetHours) || 72,
            Number(rule.escalationThresholdHours) || 96,
            Boolean(rule.autoEscalate),
            rule.priority,
          ]
        );
      }

      if (user) {
        await conn.query(
          `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
           VALUES (?, ?, ?, 'SLA_RULES_UPDATED', 'sla_rule', 'global', 'Updated SLA threshold hours across priority matrix')`,
          [user.id, user.role, user.name]
        );
      }
    });

    const [rows] = await pool.query(
      "SELECT * FROM escalation_rules ORDER BY FIELD(priority, 'critical', 'high', 'medium', 'low')"
    );
    return res.json(rows.map((r) => mapSLARuleRow(r)));
  } catch (error) {
    next(error);
  }
}
