import {
  AuditLog,
  Comment,
  Complaint,
  ComplaintCategory,
  ComplaintFeedback,
  ComplaintFilterOptions,
  Department,
  Notification,
  SLARule,
  StatusHistoryEntry,
  User,
} from '../types';

export interface IComplaintRepository {
  // Complaints
  getComplaints(filters?: ComplaintFilterOptions, currentUser?: User): Promise<{ complaints: Complaint[]; total: number }>;
  getComplaintById(id: string, currentUser?: User): Promise<Complaint | null>;
  createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'slaDeadline' | 'isOverdue' | 'reopenCount' | 'isArchived'>, currentUser: User): Promise<Complaint>;
  updateComplaint(id: string, updates: Partial<Complaint>, currentUser: User): Promise<Complaint>;
  archiveComplaint(id: string, currentUser: User): Promise<boolean>;

  // Status transitions & Audit History
  getStatusHistory(complaintId: string): Promise<StatusHistoryEntry[]>;
  addStatusHistory(entry: Omit<StatusHistoryEntry, 'id' | 'timestamp'>): Promise<StatusHistoryEntry>;

  // Comments
  getComments(complaintId: string, currentUser?: User): Promise<Comment[]>;
  addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment>;

  // Feedback
  addFeedback(feedback: Omit<ComplaintFeedback, 'id' | 'submittedAt'>): Promise<ComplaintFeedback>;

  // Categories & Departments
  getCategories(): Promise<ComplaintCategory[]>;
  createCategory(category: Omit<ComplaintCategory, 'id'>, currentUser: User): Promise<ComplaintCategory>;
  updateCategory(id: string, updates: Partial<ComplaintCategory>, currentUser: User): Promise<ComplaintCategory>;

  getDepartments(): Promise<Department[]>;
  createDepartment(department: Omit<Department, 'id'>, currentUser: User): Promise<Department>;
  updateDepartment(id: string, updates: Partial<Department>, currentUser: User): Promise<Department>;

  // Users & Staff
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt'>, currentUser: User): Promise<User>;
  updateUser(id: string, updates: Partial<User>, currentUser: User): Promise<User>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // SLA Rules & Audit Logs
  getSLARules(): Promise<SLARule[]>;
  updateSLARules(rules: SLARule[], currentUser: User): Promise<SLARule[]>;
  getAuditLogs(): Promise<AuditLog[]>;
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;

  // Development/Reset
  resetToInitialSeed(): Promise<void>;
}
