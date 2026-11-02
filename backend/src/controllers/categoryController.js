import { pool, withTransaction } from '../config/db.js';
import { mapCategoryRow } from '../utils/mappers.js';

/**
 * GET /api/v1/categories
 * Returns complaint categories with their nested subcategories.
 */
export async function getCategories(req, res, next) {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM complaint_categories ORDER BY name ASC'
    );

    const [subcategories] = await pool.query(
      'SELECT * FROM complaint_subcategories ORDER BY name ASC'
    );

    // Group subcategories by category_id
    const subMap = {};
    for (const sub of subcategories) {
      if (!subMap[sub.category_id]) {
        subMap[sub.category_id] = [];
      }
      subMap[sub.category_id].push(sub);
    }

    const result = categories.map((cat) => mapCategoryRow(cat, subMap[cat.id] || []));
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/categories
 * Creates a category and optional subcategories (Admin only).
 */
export async function createCategory(req, res, next) {
  try {
    const { name, description, iconName, defaultDepartmentId, isSensitive, subcategories } = req.body;
    const user = req.user;

    if (!name || !defaultDepartmentId) {
      return res.status(400).json({ success: false, message: 'Name and default department are required.' });
    }

    const created = await withTransaction(async (conn) => {
      // Insert category
      await conn.query(
        `INSERT INTO complaint_categories (name, description, icon_name, default_department_id, is_sensitive, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [name.trim(), description || '', iconName || 'Folder', defaultDepartmentId, Boolean(isSensitive)]
      );

      // Fetch created category to get auto-generated UUID
      const [catRows] = await conn.query('SELECT * FROM complaint_categories WHERE name = ?', [name.trim()]);
      const cat = catRows[0];

      // Insert subcategories if provided
      const insertedSubs = [];
      if (Array.isArray(subcategories)) {
        for (const sub of subcategories) {
          const subName = typeof sub === 'string' ? sub : sub.name;
          if (subName && subName.trim()) {
            await conn.query(
              `INSERT INTO complaint_subcategories (category_id, name, description, is_active)
               VALUES (?, ?, ?, TRUE)`,
              [cat.id, subName.trim(), sub.description || '']
            );
            insertedSubs.push({ name: subName.trim(), description: sub.description || '' });
          }
        }
      }

      if (user) {
        await conn.query(
          `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
           VALUES (?, ?, ?, 'CATEGORY_CREATED', 'category', ?, ?)`,
          [user.id, user.role, user.name, cat.id, JSON.stringify({ name: cat.name })]
        );
      }

      const [subRows] = await conn.query('SELECT * FROM complaint_subcategories WHERE category_id = ?', [cat.id]);
      return mapCategoryRow(cat, subRows);
    });

    return res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/categories/:id
 * Updates category details and subcategories (Admin only).
 */
export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, iconName, defaultDepartmentId, isSensitive, isActive, subcategories } = req.body;
    const user = req.user;

    const updated = await withTransaction(async (conn) => {
      const setClauses = [];
      const params = [];

      if (name) {
        setClauses.push('name = ?');
        params.push(name.trim());
      }
      if (description !== undefined) {
        setClauses.push('description = ?');
        params.push(description);
      }
      if (iconName) {
        setClauses.push('icon_name = ?');
        params.push(iconName);
      }
      if (defaultDepartmentId) {
        setClauses.push('default_department_id = ?');
        params.push(defaultDepartmentId);
      }
      if (isSensitive !== undefined) {
        setClauses.push('is_sensitive = ?');
        params.push(Boolean(isSensitive));
      }
      if (isActive !== undefined) {
        setClauses.push('is_active = ?');
        params.push(Boolean(isActive));
      }

      if (setClauses.length > 0) {
        params.push(id);
        await conn.query(`UPDATE complaint_categories SET ${setClauses.join(', ')} WHERE id = ?`, params);
      }

      // If subcategories were provided as a full replacement
      if (Array.isArray(subcategories)) {
        await conn.query('DELETE FROM complaint_subcategories WHERE category_id = ?', [id]);
        for (const sub of subcategories) {
          const subName = typeof sub === 'string' ? sub : sub.name;
          if (subName && subName.trim()) {
            await conn.query(
              `INSERT INTO complaint_subcategories (category_id, name, description, is_active)
               VALUES (?, ?, ?, TRUE)`,
              [id, subName.trim(), sub.description || '']
            );
          }
        }
      }

      const [catRows] = await conn.query('SELECT * FROM complaint_categories WHERE id = ?', [id]);
      if (catRows.length === 0) throw new Error('Category not found.');
      const [subRows] = await conn.query('SELECT * FROM complaint_subcategories WHERE category_id = ?', [id]);

      return mapCategoryRow(catRows[0], subRows);
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
}
