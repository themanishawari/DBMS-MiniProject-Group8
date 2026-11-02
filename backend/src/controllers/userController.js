import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { mapUserRow } from '../utils/mappers.js';

/**
 * GET /api/v1/users
 * Returns directory of users without exposing password hashes.
 */
export async function getUsers(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.role_id, u.email, u.full_name, u.student_id, u.department_id, u.phone, u.avatar_url, u.is_active, u.created_at,
             d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.full_name ASC
    `);

    return res.json(rows.map((r) => mapUserRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id
 * Returns single user by ID.
 */
export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, u.email, u.full_name, u.student_id, u.department_id, u.phone, u.avatar_url, u.is_active, u.created_at,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `User ${id} not found.` });
    }

    return res.json(mapUserRow(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/users
 * Creates a user account with hashed password (Admin only).
 */
export async function createUser(req, res, next) {
  try {
    const { name, email, role, studentId, departmentId, phone, password } = req.body;
    const user = req.user;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    // Default password 'password123' if omitted
    const rawPassword = password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    await pool.query(
      `INSERT INTO users (role_id, email, password_hash, full_name, student_id, department_id, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        role,
        email.trim().toLowerCase(),
        passwordHash,
        name.trim(),
        role === 'student' ? studentId?.trim() || null : null,
        role === 'staff' ? departmentId || null : null,
        phone ? phone.trim() : null,
      ]
    );

    const [rows] = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, 'USER_CREATED', 'user', ?, ?)`,
        [user.id, user.role, user.name, rows[0].id, JSON.stringify({ email, role })]
      );
    }

    return res.status(201).json(mapUserRow(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/users/:id
 * Updates an existing user profile or toggles isActive (Self or Admin only).
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role, departmentId, studentId, phone, avatarUrl, isActive, password } = req.body;
    const currentUser = req.user;

    // Check authorization: self or admin
    if (currentUser && currentUser.id !== id && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this user.' });
    }

    const setClauses = [];
    const params = [];

    if (name) {
      setClauses.push('full_name = ?');
      params.push(name.trim());
    }
    if (role && (!currentUser || currentUser.role === 'admin')) {
      setClauses.push('role_id = ?');
      params.push(role);
    }
    if (departmentId !== undefined && (!currentUser || currentUser.role === 'admin')) {
      setClauses.push('department_id = ?');
      params.push(departmentId || null);
    }
    if (studentId !== undefined && (!currentUser || currentUser.role === 'admin')) {
      setClauses.push('student_id = ?');
      params.push(studentId || null);
    }
    if (phone !== undefined) {
      setClauses.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }
    if (avatarUrl !== undefined) {
      setClauses.push('avatar_url = ?');
      params.push(avatarUrl);
    }
    if (isActive !== undefined && (!currentUser || currentUser.role === 'admin')) {
      setClauses.push('is_active = ?');
      params.push(Boolean(isActive));
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      setClauses.push('password_hash = ?');
      params.push(hash);
    }

    if (setClauses.length > 0) {
      params.push(id);
      await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const [rows] = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json(mapUserRow(rows[0]));
  } catch (error) {
    next(error);
  }
}
