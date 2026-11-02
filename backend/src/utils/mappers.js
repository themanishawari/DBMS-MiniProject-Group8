/**
 * CCMS Data Mappers
 * Maps MySQL 8.0 relational snake_case database rows into the exact
 * camelCase JSON response contracts expected by the React frontend components.
 */

/**
 * Format a JavaScript Date or MySQL timestamp into standard ISO string
 */
export function toISO(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Maps a joined complaint row to the Complaint frontend interface
 */
export function mapComplaintRow(row, attachments = [], feedback = null) {
  if (!row) return null;

  const complaint = {
    id: row.id,
    title: row.title,
    description: row.description,
    categoryId: row.category_id,
    categoryName: row.category_name || 'General',
    subcategoryId: row.subcategory_id || null,
    subcategoryName: row.subcategory_name || 'General',
    departmentId: row.department_id,
    departmentName: row.department_name || 'Administration',
    assignedStaffId: row.assigned_staff_id || undefined,
    assignedStaffName: row.assigned_staff_name || undefined,
    studentId: row.student_id,
    studentName: row.student_name || 'Anonymous Student',
    studentEmail: row.student_email || '',
    studentRollNo: row.student_roll_no || 'N/A',
    priority: row.priority,
    status: row.status,
    location: {
      campusArea: row.campus_area,
      building: row.building || undefined,
      floor: row.floor || undefined,
      roomNumber: row.room_number || undefined,
    },
    attachments: attachments || [],
    preferredContact: row.preferred_contact || 'portal',
    isSensitive: Boolean(row.is_sensitive),
    isArchived: Boolean(row.is_archived),
    slaDeadline: toISO(row.sla_deadline),
    isOverdue: Boolean(row.is_overdue),
    reopenCount: Number(row.reopen_count) || 0,
    lastReopenedAt: toISO(row.last_reopened_at) || undefined,
    reopenReason: row.reopen_reason || undefined,
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
  };

  if (row.resolved_at) {
    complaint.resolutionDetails = {
      resolvedAt: toISO(row.resolved_at),
      resolvedById: row.resolved_by_id,
      resolvedByName: row.resolved_by_name || 'Staff Member',
      actionTaken: row.resolution_action_taken || '',
      preventativeMeasures: row.resolution_preventative_measures || undefined,
    };
  }

  if (feedback) {
    complaint.feedback = feedback;
  }

  return complaint;
}

/**
 * Maps a department row to Department interface
 */
export function mapDepartmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    headOfDepartment: row.head_of_department || '',
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone || '',
    isActive: Boolean(row.is_active),
    staffCount: Number(row.staff_count) || 0,
  };
}

/**
 * Maps a category row with attached subcategories
 */
export function mapCategoryRow(row, subcategories = []) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    iconName: row.icon_name || 'Folder',
    defaultDepartmentId: row.default_department_id || '',
    isSensitive: Boolean(row.is_sensitive),
    isActive: Boolean(row.is_active),
    subcategories: (subcategories || []).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description || undefined,
    })),
  };
}

/**
 * Maps a user row (omits sensitive password_hash)
 */
export function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role_id,
    departmentId: row.department_id || undefined,
    departmentName: row.department_name || undefined,
    studentId: row.student_id || undefined,
    phone: row.phone || undefined,
    avatar: row.avatar_url || undefined,
    isActive: Boolean(row.is_active),
    createdAt: toISO(row.created_at),
  };
}

/**
 * Maps a status history row
 */
export function mapStatusHistoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    complaintId: row.complaint_id,
    fromStatus: row.from_status || undefined,
    toStatus: row.to_status,
    changedById: row.changed_by_id,
    changedByName: row.changed_by_name || 'System Actor',
    changedByRole: row.changed_by_role || 'staff',
    remarks: row.remarks || '',
    timestamp: toISO(row.created_at),
  };
}

/**
 * Maps a comment row
 */
export function mapCommentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    complaintId: row.complaint_id,
    userId: row.user_id,
    userName: row.user_name || 'Participant',
    userRole: row.user_role || 'student',
    content: row.content,
    isInternal: Boolean(row.is_internal),
    createdAt: toISO(row.created_at),
  };
}

/**
 * Maps feedback row
 */
export function mapFeedbackRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    complaintId: row.complaint_id,
    studentId: row.student_id,
    rating: Number(row.rating),
    comments: row.comments || '',
    submittedAt: toISO(row.created_at),
  };
}

/**
 * Maps an attachment row
 */
export function mapAttachmentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fileName: row.file_name,
    fileSize: Number(row.file_size_bytes),
    fileType: row.file_type,
    url: row.storage_path,
    uploadedAt: toISO(row.created_at),
  };
}

/**
 * Maps notification row
 */
export function mapNotificationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.notification_type,
    complaintId: row.complaint_id || undefined,
    isRead: Boolean(row.is_read),
    createdAt: toISO(row.created_at),
  };
}

/**
 * Maps SLA rule row
 */
export function mapSLARuleRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    priority: row.priority,
    acknowledgementTargetHours: Number(row.acknowledgement_target_hours),
    resolutionTargetHours: Number(row.resolution_target_hours),
    escalationThresholdHours: Number(row.escalation_threshold_hours),
    autoEscalate: Boolean(row.auto_escalate),
  };
}

/**
 * Maps audit log row
 */
export function mapAuditLogRow(row) {
  if (!row) return null;
  let parsedDetails = row.details;
  if (typeof parsedDetails === 'object' && parsedDetails !== null) {
    parsedDetails = JSON.stringify(parsedDetails);
  }
  return {
    id: row.id,
    timestamp: toISO(row.created_at),
    userId: row.user_id || 'system',
    userName: row.user_name || 'System',
    userRole: row.user_role || 'admin',
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: parsedDetails || '',
    ipAddress: row.ip_address || undefined,
  };
}
