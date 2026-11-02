import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { signToken } from '../middleware/auth.js';
import { mapUserRow } from '../utils/mappers.js';

/**
 * Authentication Controller
 * Handles user login, student enrollment/registration, session verification, and profile updates.
 */

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Institutional email is required.' });
    }

    // Look up user by email
    const [rows] = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user not registered.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Contact the administrator.' });
    }

    // Verify password if provided
    if (password) {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
      }
    }

    // Update last_login_at
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Generate JWT token
    const token = signToken(user);
    const userProfile = mapUserRow(user);

    return res.json({
      success: true,
      token,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, studentId, phone } = req.body;

    if (!name || !email || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Name, institutional email, and student roll number are required.',
      });
    }

    // Check if email already exists
    const [existingEmail] = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Check if studentId already exists
    const [existingStudentId] = await pool.query(
      'SELECT id FROM users WHERE student_id = ?',
      [studentId.trim()]
    );
    if (existingStudentId.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this Student Roll Number already exists.' });
    }

    // Hash password (default to 'password123' if omitted for seamless development)
    const rawPassword = password || 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // Insert user into MySQL
    const [result] = await pool.query(
      `INSERT INTO users (role_id, email, password_hash, full_name, student_id, phone, is_active)
       VALUES ('student', ?, ?, ?, ?, ?, TRUE)`,
      [email.trim().toLowerCase(), passwordHash, name.trim(), studentId.trim(), phone?.trim() || null]
    );

    // Fetch created user
    const [newUserRows] = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    const newUser = newUserRows[0];
    const token = signToken(newUser);
    const userProfile = mapUserRow(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const [rows] = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    return res.json({
      success: true,
      user: mapUserRow(rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    const { name, phone, avatarUrl } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('full_name = ?');
      params.push(name.trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone ? phone.trim() : null);
    }
    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatarUrl);
    }

    if (updates.length > 0) {
      params.push(req.user.id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [rows] = await pool.query(
      `SELECT u.*, d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    return res.json(mapUserRow(rows[0]));
  } catch (error) {
    next(error);
  }
}
