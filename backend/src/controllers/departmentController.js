import { pool } from '../config/db.js';
import { mapDepartmentRow } from '../utils/mappers.js';

/**
 * GET /api/v1/departments
 * Returns all departments with active staff headcount.
 */
export async function getDepartments(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role_id = 'staff' AND u.is_active = TRUE) AS staff_count
      FROM departments d
      ORDER BY d.name ASC
    `);

    return res.json(rows.map((r) => mapDepartmentRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/departments
 * Creates a new department (Admin only).
 */
export async function createDepartment(req, res, next) {
  try {
    const { code, name, description, headOfDepartment, contactEmail, contactPhone } = req.body;
    const user = req.user;

    if (!code || !name || !contactEmail) {
      return res.status(400).json({ success: false, message: 'Code, name, and contact email are required.' });
    }

    await pool.query(
      `INSERT INTO departments (code, name, description, head_of_department, contact_email, contact_phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [
        code.trim().toUpperCase(),
        name.trim(),
        description || '',
        headOfDepartment || '',
        contactEmail.trim(),
        contactPhone || '',
      ]
    );

    const [rows] = await pool.query('SELECT * FROM departments WHERE code = ?', [code.trim().toUpperCase()]);

    if (user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, 'DEPARTMENT_CREATED', 'department', ?, ?)`,
        [user.id, user.role, user.name, rows[0].id, JSON.stringify({ code, name })]
      );
    }

    return res.status(201).json(mapDepartmentRow(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/departments/:id
 * Updates an existing department (Admin only).
 */
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, description, headOfDepartment, contactEmail, contactPhone, isActive } = req.body;
    const user = req.user;

    const setClauses = [];
    const params = [];

    if (code) {
      setClauses.push('code = ?');
      params.push(code.trim().toUpperCase());
    }
    if (name) {
      setClauses.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      setClauses.push('description = ?');
      params.push(description);
    }
    if (headOfDepartment !== undefined) {
      setClauses.push('head_of_department = ?');
      params.push(headOfDepartment);
    }
    if (contactEmail) {
      setClauses.push('contact_email = ?');
      params.push(contactEmail.trim());
    }
    if (contactPhone !== undefined) {
      setClauses.push('contact_phone = ?');
      params.push(contactPhone);
    }
    if (isActive !== undefined) {
      setClauses.push('is_active = ?');
      params.push(Boolean(isActive));
    }

    if (setClauses.length > 0) {
      params.push(id);
      await pool.query(`UPDATE departments SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const [rows] = await pool.query(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id AND u.role_id = 'staff' AND u.is_active = TRUE) AS staff_count
       FROM departments d WHERE d.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    return res.json(mapDepartmentRow(rows[0]));
  } catch (error) {
    next(error);
  }
}
