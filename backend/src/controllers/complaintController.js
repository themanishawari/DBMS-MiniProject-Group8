import { pool, withTransaction } from '../config/db.js';
import { mapAttachmentRow, mapComplaintRow, mapFeedbackRow, mapStatusHistoryRow } from '../utils/mappers.js';

// Status transition state machine rules
const ALLOWED_TRANSITIONS = {
  submitted: {
    nextStatuses: ['acknowledged', 'assigned', 'rejected'],
    allowedRoles: ['staff', 'admin'],
  },
  acknowledged: {
    nextStatuses: ['assigned', 'in_progress', 'rejected', 'escalated'],
    allowedRoles: ['staff', 'admin'],
  },
  assigned: {
    nextStatuses: ['in_progress', 'awaiting_student_response', 'escalated', 'rejected'],
    allowedRoles: ['staff', 'admin'],
  },
  in_progress: {
    nextStatuses: ['awaiting_student_response', 'resolved', 'escalated', 'rejected'],
    allowedRoles: ['staff', 'admin'],
  },
  awaiting_student_response: {
    nextStatuses: ['in_progress', 'resolved', 'closed'],
    allowedRoles: ['student', 'staff', 'admin'],
  },
  escalated: {
    nextStatuses: ['in_progress', 'resolved', 'assigned'],
    allowedRoles: ['admin', 'staff'],
  },
  resolved: {
    nextStatuses: ['closed', 'reopened'],
    allowedRoles: ['student', 'admin'],
  },
  closed: {
    nextStatuses: ['reopened'],
    allowedRoles: ['admin'],
  },
  reopened: {
    nextStatuses: ['in_progress', 'assigned', 'escalated', 'resolved'],
    allowedRoles: ['staff', 'admin'],
  },
  rejected: {
    nextStatuses: ['submitted'],
    allowedRoles: ['admin'],
  },
};

const BASE_COMPLAINT_SELECT = `
  SELECT 
    c.*,
    cat.name AS category_name,
    sub.name AS subcategory_name,
    d.name AS department_name,
    u_stu.full_name AS student_name,
    u_stu.email AS student_email,
    u_stu.student_id AS student_roll_no,
    u_staff.full_name AS assigned_staff_name,
    u_res.full_name AS resolved_by_name
  FROM complaints c
  JOIN complaint_categories cat ON c.category_id = cat.id
  LEFT JOIN complaint_subcategories sub ON c.subcategory_id = sub.id
  JOIN departments d ON c.department_id = d.id
  JOIN users u_stu ON c.student_id = u_stu.id
  LEFT JOIN users u_staff ON c.assigned_staff_id = u_staff.id
  LEFT JOIN users u_res ON c.resolved_by_id = u_res.id
`;

/**
 * GET /api/v1/complaints
 * Returns list of complaints filtered by user role and search query parameters.
 */
export async function getComplaints(req, res, next) {
  try {
    const user = req.user;
    const {
      searchQuery,
      status,
      priority,
      categoryId,
      departmentId,
      assignedStaffId,
      isOverdue,
      isSensitive,
      dateFrom,
      dateTo,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      page,
      pageSize,
    } = req.query;

    const whereClauses = [];
    const params = [];

    // 1. Role-based scoping
    if (user) {
      if (user.role === 'student') {
        whereClauses.push('c.student_id = ?');
        params.push(user.id);
      } else if (user.role === 'staff') {
        // Staff see department complaints or tickets assigned directly to them
        whereClauses.push('(c.department_id = ? OR c.assigned_staff_id = ?)');
        params.push(user.departmentId, user.id);

        // Sensitive complaints only visible if directly assigned
        whereClauses.push('(c.is_sensitive = FALSE OR c.assigned_staff_id = ?)');
        params.push(user.id);
      }
      // Admin sees all
    }

    // 2. Hide archived unless explicitly requested
    whereClauses.push('c.is_archived = FALSE');

    // 3. Dynamic filters
    if (searchQuery && searchQuery.trim()) {
      const q = `%${searchQuery.trim().toLowerCase()}%`;
      whereClauses.push(
        '(LOWER(c.id) LIKE ? OR LOWER(c.title) LIKE ? OR LOWER(c.description) LIKE ? OR LOWER(c.campus_area) LIKE ? OR LOWER(u_stu.full_name) LIKE ? OR LOWER(u_stu.student_id) LIKE ?)'
      );
      params.push(q, q, q, q, q, q);
    }

    if (status && status !== 'all') {
      whereClauses.push('c.status = ?');
      params.push(status);
    }

    if (priority && priority !== 'all') {
      whereClauses.push('c.priority = ?');
      params.push(priority);
    }

    if (categoryId && categoryId !== 'all') {
      whereClauses.push('c.category_id = ?');
      params.push(categoryId);
    }

    if (departmentId && departmentId !== 'all') {
      whereClauses.push('c.department_id = ?');
      params.push(departmentId);
    }

    if (assignedStaffId && assignedStaffId !== 'all') {
      whereClauses.push('c.assigned_staff_id = ?');
      params.push(assignedStaffId);
    }

    if (isOverdue !== undefined && isOverdue !== 'all') {
      whereClauses.push('c.is_overdue = ?');
      params.push(isOverdue === 'true' || isOverdue === true ? 1 : 0);
    }

    if (isSensitive !== undefined && isSensitive !== 'all') {
      whereClauses.push('c.is_sensitive = ?');
      params.push(isSensitive === 'true' || isSensitive === true ? 1 : 0);
    }

    if (dateFrom) {
      whereClauses.push('c.created_at >= ?');
      params.push(new Date(dateFrom));
    }

    if (dateTo) {
      whereClauses.push('c.created_at <= ?');
      params.push(new Date(dateTo));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total rows
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM complaints c
      JOIN users u_stu ON c.student_id = u_stu.id
      ${whereSQL}
    `;
    const [countRows] = await pool.query(countQuery, params);
    const total = Number(countRows[0]?.total || 0);

    // Sorting column validation
    const validSortCols = {
      createdAt: 'c.created_at',
      created_at: 'c.created_at',
      updatedAt: 'c.updated_at',
      updated_at: 'c.updated_at',
      priority: 'FIELD(c.priority, "critical", "high", "medium", "low")',
      status: 'c.status',
    };
    const orderCol = validSortCols[sortBy] || 'c.created_at';
    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pagination
    let paginationSQL = '';
    const paginationParams = [...params];
    if (page && pageSize) {
      const p = Math.max(1, Number(page));
      const ps = Math.max(1, Number(pageSize));
      const offset = (p - 1) * ps;
      paginationSQL = 'LIMIT ? OFFSET ?';
      paginationParams.push(ps, offset);
    }

    const dataQuery = `
      ${BASE_COMPLAINT_SELECT}
      ${whereSQL}
      ORDER BY ${orderCol} ${orderDir}
      ${paginationSQL}
    `;

    const [rows] = await pool.query(dataQuery, paginationParams);
    const complaints = rows.map((r) => mapComplaintRow(r));

    return res.json({ complaints, total });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/complaints/:id
 * Returns single complaint with authorization check, attachments, and feedback.
 */
export async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const [rows] = await pool.query(
      `${BASE_COMPLAINT_SELECT} WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Complaint ${id} not found.` });
    }

    const row = rows[0];

    // Authorization checks
    if (user) {
      if (user.role === 'student' && row.student_id !== user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this complaint.' });
      }

      if (user.role === 'staff') {
        const isDept = row.department_id === user.departmentId;
        const isAssigned = row.assigned_staff_id === user.id;

        if (row.is_sensitive && !isAssigned) {
          return res.status(403).json({ success: false, message: 'Access denied: Sensitive complaint restricted.' });
        }
        if (!isDept && !isAssigned) {
          return res.status(403).json({ success: false, message: 'Access denied: You can only view complaints for your department.' });
        }
      }
    }

    // Fetch attachments and feedback
    const [attRows] = await pool.query(
      'SELECT * FROM complaint_attachments WHERE complaint_id = ? ORDER BY created_at ASC',
      [id]
    );
    const attachments = attRows.map((a) => mapAttachmentRow(a));

    const [fbRows] = await pool.query(
      'SELECT * FROM complaint_feedback WHERE complaint_id = ?',
      [id]
    );
    const feedback = fbRows.length > 0 ? mapFeedbackRow(fbRows[0]) : null;

    return res.json(mapComplaintRow(row, attachments, feedback));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/complaints
 * Submits a new complaint inside an ACID transaction.
 */
export async function createComplaint(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required to submit complaints.' });
    }

    if (user.role !== 'student' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only students can submit grievances.' });
    }

    const data = req.body;

    if (!data.title || data.title.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Complaint title must be at least 6 characters.' });
    }
    if (!data.description || data.description.trim().length < 20) {
      return res.status(400).json({ success: false, message: 'Description must be at least 20 characters.' });
    }
    if (!data.categoryId || !data.departmentId) {
      return res.status(400).json({ success: false, message: 'Category and department are required.' });
    }

    const priority = data.priority || 'medium';
    const location = data.location || {};

    const createdComplaint = await withTransaction(async (conn) => {
      // 1. Generate human-readable identifier: CCMS-YYYY-XXXX
      const currentYear = new Date().getFullYear();
      const [countRows] = await conn.query(
        'SELECT COUNT(*) AS total FROM complaints WHERE id LIKE ?',
        [`CCMS-${currentYear}-%`]
      );
      const nextNum = 1000 + Number(countRows[0].total) + 1;
      const complaintId = `CCMS-${currentYear}-${nextNum}`;

      // 2. Fetch resolution target hours from SLA rules
      const [slaRows] = await conn.query(
        'SELECT resolution_target_hours FROM escalation_rules WHERE priority = ?',
        [priority]
      );
      const targetHours = slaRows.length > 0 ? Number(slaRows[0].resolution_target_hours) : 72;

      // 3. Insert complaint
      await conn.query(
        `INSERT INTO complaints (
          id, title, description, category_id, subcategory_id, department_id,
          student_id, priority, status, campus_area, building, floor, room_number,
          preferred_contact, is_sensitive, sla_deadline, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, 'submitted', ?, ?, ?, ?,
          ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR), NOW(), NOW()
        )`,
        [
          complaintId,
          data.title.trim(),
          data.description.trim(),
          data.categoryId,
          data.subcategoryId || null,
          data.departmentId,
          user.id,
          priority,
          location.campusArea || data.campusArea || 'Campus Area',
          location.building || data.building || null,
          location.floor || data.floor || null,
          location.roomNumber || data.roomNumber || null,
          data.preferredContact || 'portal',
          Boolean(data.isSensitive),
          targetHours,
        ]
      );

      // 4. Save attachments if provided
      if (Array.isArray(data.attachments)) {
        for (const att of data.attachments) {
          await conn.query(
            `INSERT INTO complaint_attachments (complaint_id, file_name, file_size_bytes, file_type, storage_path, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              complaintId,
              att.fileName || 'attachment',
              att.fileSize || 0,
              att.fileType || 'application/octet-stream',
              att.url || '#',
              user.id,
            ]
          );
        }
      }

      // 5. Insert initial status history
      await conn.query(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by_id, remarks)
         VALUES (?, NULL, 'submitted', ?, ?)`,
        [complaintId, user.id, 'Complaint submitted by student']
      );

      // 6. Record audit log
      await conn.query(
        `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, 'COMPLAINT_CREATED', 'complaint', ?, ?)`,
        [
          user.id,
          user.role,
          user.name,
          complaintId,
          JSON.stringify({ title: data.title, priority }),
        ]
      );

      // 7. Notification for student
      await conn.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id)
         VALUES (?, ?, ?, 'status_update', ?)`,
        [
          user.id,
          `Complaint Registered: ${complaintId}`,
          `Your complaint "${data.title}" has been successfully logged.`,
          complaintId,
        ]
      );

      // 8. Notifications for department staff
      const [deptStaff] = await conn.query(
        'SELECT id FROM users WHERE department_id = ? AND role_id = "staff" AND is_active = TRUE',
        [data.departmentId]
      );
      for (const staff of deptStaff) {
        await conn.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id)
           VALUES (?, ?, ?, 'assignment', ?)`,
          [
            staff.id,
            `New Department Ticket: ${complaintId}`,
            `A new ${priority.toUpperCase()} priority complaint has been submitted: "${data.title}".`,
            complaintId,
          ]
        );
      }

      // Fetch newly created complaint with joins
      const [newRow] = await conn.query(
        `${BASE_COMPLAINT_SELECT} WHERE c.id = ?`,
        [complaintId]
      );

      return mapComplaintRow(newRow[0]);
    });

    return res.status(201).json(createdComplaint);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/complaints/:id
 * Updates complaint details or transitions status.
 */
export async function updateComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    const [rows] = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Complaint ${id} not found.` });
    }
    const current = rows[0];

    // Status transition request
    if (updates.status && updates.status !== current.status) {
      return transitionComplaintStatus(id, updates.status, updates.remarks || 'Status updated', user, updates.resolutionAction, res, next);
    }

    const setClauses = [];
    const params = [];

    if (updates.title) {
      setClauses.push('title = ?');
      params.push(updates.title);
    }
    if (updates.description) {
      setClauses.push('description = ?');
      params.push(updates.description);
    }
    if (updates.priority) {
      setClauses.push('priority = ?');
      params.push(updates.priority);
    }
    if (updates.assignedStaffId !== undefined) {
      setClauses.push('assigned_staff_id = ?');
      params.push(updates.assignedStaffId || null);
    }
    if (updates.departmentId) {
      setClauses.push('department_id = ?');
      params.push(updates.departmentId);
    }

    if (setClauses.length > 0) {
      params.push(id);
      await pool.query(`UPDATE complaints SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    const [updatedRows] = await pool.query(`${BASE_COMPLAINT_SELECT} WHERE c.id = ?`, [id]);
    return res.json(mapComplaintRow(updatedRows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to execute workflow status transition
 */
async function transitionComplaintStatus(complaintId, newStatus, remarks, user, resolutionAction, res, next) {
  try {
    const updated = await withTransaction(async (conn) => {
      const [rows] = await conn.query('SELECT * FROM complaints WHERE id = ?', [complaintId]);
      if (rows.length === 0) throw new Error('Complaint not found.');
      const current = rows[0];

      // Validate transition state machine
      const rule = ALLOWED_TRANSITIONS[current.status];
      if (!rule || !rule.nextStatuses.includes(newStatus)) {
        throw new Error(`Invalid status change: Cannot transition from '${current.status}' to '${newStatus}'.`);
      }
      if (user && !rule.allowedRoles.includes(user.role)) {
        throw new Error(`Permission denied: Role '${user.role}' cannot transition ticket to '${newStatus}'.`);
      }

      const updateFields = ['status = ?', 'updated_at = NOW()'];
      const updateParams = [newStatus];

      if (newStatus === 'resolved') {
        updateFields.push('resolved_at = NOW()', 'resolved_by_id = ?', 'resolution_action_taken = ?');
        updateParams.push(user ? user.id : null, resolutionAction || remarks);
      }

      if (newStatus === 'reopened') {
        updateFields.push('reopen_count = reopen_count + 1', 'last_reopened_at = NOW()', 'reopen_reason = ?');
        updateParams.push(remarks);
      }

      updateParams.push(complaintId);
      await conn.query(`UPDATE complaints SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

      // Status history entry
      await conn.query(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by_id, remarks)
         VALUES (?, ?, ?, ?, ?)`,
        [complaintId, current.status, newStatus, user ? user.id : current.student_id, remarks || `Status changed to ${newStatus}`]
      );

      // Audit log
      if (user) {
        await conn.query(
          `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
           VALUES (?, ?, ?, 'STATUS_TRANSITION', 'complaint', ?, ?)`,
          [user.id, user.role, user.name, complaintId, JSON.stringify({ from: current.status, to: newStatus, remarks })]
        );
      }

      // Notification to student
      await conn.query(
        `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id)
         VALUES (?, ?, ?, 'status_update', ?)`,
        [
          current.student_id,
          `Status Update: ${complaintId}`,
          `Your complaint status has changed to "${newStatus.toUpperCase()}". Remarks: ${remarks}`,
          complaintId,
        ]
      );

      const [newRow] = await conn.query(`${BASE_COMPLAINT_SELECT} WHERE c.id = ?`, [complaintId]);
      return mapComplaintRow(newRow[0]);
    });

    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

/**
 * POST /api/v1/complaints/:id/archive
 * Soft-archives a complaint (Admin only).
 */
export async function archiveComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can archive complaints.' });
    }

    await pool.query('UPDATE complaints SET is_archived = TRUE WHERE id = ?', [id]);

    if (user) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_role, user_name, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, 'COMPLAINT_ARCHIVED', 'complaint', ?, 'Complaint soft-archived')`,
        [user.id, user.role, user.name, id]
      );
    }

    return res.json({ success: true, message: `Complaint ${id} archived.` });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/complaints/:id/history
 * Returns the status transition history log for a complaint.
 */
export async function getStatusHistory(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT h.*, u.full_name AS changed_by_name, u.role_id AS changed_by_role
       FROM complaint_status_history h
       JOIN users u ON h.changed_by_id = u.id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC`,
      [id]
    );

    return res.json(rows.map((r) => mapStatusHistoryRow(r)));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/complaints/:id/history
 * Records a status transition entry.
 */
export async function addStatusHistory(req, res, next) {
  try {
    const { id } = req.params;
    const { toStatus, fromStatus, remarks } = req.body;
    const user = req.user;

    const [result] = await pool.query(
      `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by_id, remarks)
       VALUES (?, ?, ?, ?, ?)`,
      [id, fromStatus || null, toStatus, user ? user.id : req.body.changedById, remarks || '']
    );

    const [rows] = await pool.query(
      `SELECT h.*, u.full_name AS changed_by_name, u.role_id AS changed_by_role
       FROM complaint_status_history h
       JOIN users u ON h.changed_by_id = u.id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at DESC LIMIT 1`,
      [id]
    );

    return res.status(201).json(mapStatusHistoryRow(rows[0]));
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/complaints/:id/assign
 * Assigns or reassigns a complaint to a department and specific handler.
 */
export async function assignComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { departmentId, assignedStaffId, remarks } = req.body;
    const user = req.user;

    if (user && user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Only staff and admins can assign complaints.' });
    }

    const updated = await withTransaction(async (conn) => {
      const [currentRows] = await conn.query('SELECT * FROM complaints WHERE id = ?', [id]);
      if (currentRows.length === 0) throw new Error('Complaint not found.');
      const current = currentRows[0];

      const newStatus = current.status === 'submitted' ? 'assigned' : current.status;

      await conn.query(
        `UPDATE complaints 
         SET department_id = ?, assigned_staff_id = ?, status = ?
         WHERE id = ?`,
        [departmentId || current.department_id, assignedStaffId || null, newStatus, id]
      );

      // Status history entry
      await conn.query(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by_id, remarks)
         VALUES (?, ?, ?, ?, ?)`,
        [id, current.status, newStatus, user ? user.id : current.student_id, remarks || 'Handler assigned to complaint']
      );

      // Notify staff
      if (assignedStaffId) {
        await conn.query(
          `INSERT INTO notifications (user_id, title, message, notification_type, complaint_id)
           VALUES (?, ?, ?, 'assignment', ?)`,
          [
            assignedStaffId,
            `Assigned to Complaint ${id}`,
            `You have been assigned to handle complaint "${current.title}".`,
            id,
          ]
        );
      }

      const [newRow] = await conn.query(`${BASE_COMPLAINT_SELECT} WHERE c.id = ?`, [id]);
      return mapComplaintRow(newRow[0]);
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
}
