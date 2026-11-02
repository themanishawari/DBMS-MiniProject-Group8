import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * POST /api/v1/dev/reset
 * Development utility: re-executes seed insertions or resets database state.
 */
export async function resetDatabase(req, res, next) {
  try {
    const sqlPath = path.resolve(__dirname, '../../database/schema.mysql.sql');
    if (!fs.existsSync(sqlPath)) {
      return res.status(404).json({ success: false, message: 'schema.mysql.sql file not found.' });
    }

    console.log('[CCMS Dev] Resetting demonstration database from schema.mysql.sql...');
    // We execute seed data refresh
    await pool.query('DELETE FROM complaint_feedback');
    await pool.query('DELETE FROM complaint_comments');
    await pool.query('DELETE FROM complaint_status_history');
    await pool.query('DELETE FROM complaint_attachments');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM complaints');

    // Re-seed representative complaint
    await pool.query(`
      INSERT IGNORE INTO complaints (
        id, title, description, category_id, subcategory_id, department_id, 
        student_id, assigned_staff_id, priority, status, 
        campus_area, building, floor, room_number, preferred_contact, 
        is_sensitive, is_archived, sla_deadline, is_overdue, reopen_count,
        created_at, updated_at
      ) VALUES (
        'CCMS-2026-1001',
        'High-speed Wi-Fi router offline in Turing Computer Lab 3',
        'Students working on Capstone semester projects in Computer Lab 3 have been unable to connect to the campus subnet since yesterday afternoon. The central AP displays a solid red light.',
        'cat-it', 'sub-it-1', 'dept-it',
        'user-student-1', 'user-staff-it', 'high', 'in_progress',
        'Academic Block A (Computer & IT)', 'Software Lab Annex', '3rd Floor', 'Lab 302', 'portal',
        FALSE, FALSE, DATE_ADD(NOW(), INTERVAL 48 HOUR), FALSE, 0,
        NOW(), NOW()
      )
    `);

    await pool.query(`
      INSERT IGNORE INTO complaint_status_history (id, complaint_id, from_status, to_status, changed_by_id, remarks, created_at) VALUES
      ('hist-demo-1', 'CCMS-2026-1001', NULL, 'submitted', 'user-student-1', 'Initial complaint filed with AP physical observations.', NOW()),
      ('hist-demo-2', 'CCMS-2026-1001', 'submitted', 'assigned', 'user-admin', 'Assigned directly to Vikram Verma for network topology diagnosis.', NOW()),
      ('hist-demo-3', 'CCMS-2026-1001', 'assigned', 'in_progress', 'user-staff-it', 'Hardware reboot attempted; replacing faulty PoE injector on rack switch.', NOW())
    `);

    await pool.query(`
      INSERT IGNORE INTO complaint_comments (id, complaint_id, user_id, content, is_internal, created_at) VALUES
      ('comm-demo-1', 'CCMS-2026-1001', 'user-staff-it', 'Diagnosed switch port 14 flapping. Dispatching network technician with spare Cisco PoE module.', FALSE, NOW()),
      ('comm-demo-2', 'CCMS-2026-1001', 'user-staff-it', 'INTERNAL NOTE: Spare switch inventory checked. Replacement unit tagged IT-HW-884.', TRUE, NOW())
    `);

    return res.json({
      success: true,
      message: 'Demonstration records reset successfully to initial state.',
    });
  } catch (error) {
    next(error);
  }
}
