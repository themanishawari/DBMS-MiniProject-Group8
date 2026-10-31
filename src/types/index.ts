// Types and Interfaces for College Complaint Management System (CCMS)

export type Role = 'student' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string; // For staff members
  departmentName?: string;
  studentId?: string;    // E.g., ENG-2024-042
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  staffCount: number;
}

export interface Subcategory {
  id: string;
  name: string;
  description?: string;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  defaultDepartmentId: string;
  isSensitive: boolean; // E.g., harassment, safety - requires confidential handling
  isActive: boolean;
  subcategories: Subcategory[];
}

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus =
  | 'submitted'
  | 'acknowledged'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_student_response'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'rejected';

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  userRole: Role;
  content: string;
  isInternal: boolean; // If true, only visible to staff & admin
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  complaintId: string;
  fromStatus?: ComplaintStatus;
  toStatus: ComplaintStatus;
  changedById: string;
  changedByName: string;
  changedByRole: Role;
  remarks: string;
  timestamp: string;
}

export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  studentId: string;
  rating: number; // 1 to 5 stars
  comments: string;
  submittedAt: string;
}

export interface LocationDetails {
  campusArea: string; // E.g., 'North Academic Block', 'Boys Hostel 2', 'Central Library'
  building?: string;
  floor?: string;
  roomNumber?: string;
}

export interface Complaint {
  id: string; // E.g., 'CCMS-2026-1001'
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  departmentId: string;
  departmentName: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRollNo: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: LocationDetails;
  attachments: Attachment[];
  preferredContact: 'email' | 'phone' | 'portal';
  isSensitive: boolean; // Confidential routing
  isArchived: boolean;
  slaDeadline: string; // ISO string
  isOverdue: boolean;
  resolutionDetails?: {
    resolvedAt: string;
    resolvedById: string;
    resolvedByName: string;
    actionTaken: string;
    preventativeMeasures?: string;
  };
  reopenCount: number;
  lastReopenedAt?: string;
  reopenReason?: string;
  feedback?: ComplaintFeedback;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'status_update' | 'assignment' | 'comment' | 'escalation' | 'sla_warning' | 'system';
  complaintId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SLARule {
  id: string;
  priority: ComplaintPriority;
  acknowledgementTargetHours: number;
  resolutionTargetHours: number;
  escalationThresholdHours: number;
  autoEscalate: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  entityType: 'complaint' | 'user' | 'department' | 'category' | 'sla_rule' | 'auth';
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface ComplaintFilterOptions {
  searchQuery?: string;
  status?: ComplaintStatus | 'all';
  priority?: ComplaintPriority | 'all';
  categoryId?: string | 'all';
  departmentId?: string | 'all';
  assignedStaffId?: string | 'all';
  dateFrom?: string;
  dateTo?: string;
  isOverdue?: boolean;
  isSensitive?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
