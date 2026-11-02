import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ccms_jwt_secure_key_2026_super_secret_for_college_grievances';

/**
 * Authentication Middleware
 * Validates JWT Bearer tokens from the Authorization header.
 * Attaches authenticated user object (from MySQL) to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Look up user in MySQL to ensure account is active and role is fresh
        const [rows] = await pool.query(
          `SELECT u.id, u.role_id, u.email, u.full_name, u.student_id, u.department_id, u.is_active, d.name AS department_name
           FROM users u
           LEFT JOIN departments d ON u.department_id = d.id
           WHERE u.id = ?`,
          [decoded.id]
        );

        if (rows.length > 0 && rows[0].is_active) {
          req.user = {
            id: rows[0].id,
            role: rows[0].role_id,
            email: rows[0].email,
            name: rows[0].full_name,
            studentId: rows[0].student_id,
            departmentId: rows[0].department_id,
            departmentName: rows[0].department_name,
          };
          return next();
        }
      } catch (jwtErr) {
        // Token invalid or expired - proceed to check fallback headers
      }
    }

    // Development & Transition Fallback:
    // If the client hasn't migrated to JWT yet, permit identification via x-user-id header
    const fallbackUserId = req.headers['x-user-id'] || req.query.userId;
    if (fallbackUserId) {
      const [rows] = await pool.query(
        `SELECT u.id, u.role_id, u.email, u.full_name, u.student_id, u.department_id, u.is_active, d.name AS department_name
         FROM users u
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = ?`,
        [fallbackUserId]
      );

      if (rows.length > 0 && rows[0].is_active) {
        req.user = {
          id: rows[0].id,
          role: rows[0].role_id,
          email: rows[0].email,
          name: rows[0].full_name,
          studentId: rows[0].student_id,
          departmentId: rows[0].department_id,
          departmentName: rows[0].department_name,
        };
        return next();
      }
    }

    // No valid credentials found
    req.user = null;
    return next();
  } catch (error) {
    console.error('Authentication error:', error);
    req.user = null;
    return next();
  }
}

/**
 * Require valid authentication
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Guard
 * @param  {...string} allowedRoles - Roles permitted (e.g. 'admin', 'staff', 'student')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'.`,
      });
    }

    next();
  };
}

/**
 * Helper to generate JWT token for a user
 */
export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role_id || user.role,
      name: user.full_name || user.name,
      departmentId: user.department_id || user.departmentId,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}
