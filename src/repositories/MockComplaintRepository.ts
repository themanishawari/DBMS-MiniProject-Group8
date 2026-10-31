import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CATEGORIES,
  INITIAL_COMMENTS,
  INITIAL_COMPLAINTS,
  INITIAL_DEPARTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SLA_RULES,
  INITIAL_STATUS_HISTORY,
  INITIAL_USERS,
} from '../data/initialSeed';
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
import { IComplaintRepository } from './IComplaintRepository';

const STORAGE_KEYS = {
  COMPLAINTS: 'ccms_complaints_v1',
  CATEGORIES: 'ccms_categories_v1',
  DEPARTMENTS: 'ccms_departments_v1',
  USERS: 'ccms_users_v1',
  COMMENTS: 'ccms_comments_v1',
  STATUS_HISTORY: 'ccms_status_history_v1',
  NOTIFICATIONS: 'ccms_notifications_v1',
  SLA_RULES: 'ccms_sla_rules_v1',
  AUDIT_LOGS: 'ccms_audit_logs_v1',
};

export class MockComplaintRepository implements IComplaintRepository {
  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized(): void {
    if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
      this.resetToInitialSeed();
    }
  }

  public async resetToInitialSeed(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(INITIAL_COMMENTS));
    localStorage.setItem(STORAGE_KEYS.STATUS_HISTORY, JSON.stringify(INITIAL_STATUS_HISTORY));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.SLA_RULES, JSON.stringify(INITIAL_SLA_RULES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  }

  private getStored<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStored<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to store data for key ${key}:`, e);
    }
  }

  // --- Complaints ---

  public async getComplaints(
    filters?: ComplaintFilterOptions,
    currentUser?: User
  ): Promise<{ complaints: Complaint[]; total: number }> {
    let allComplaints = this.getStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);

    // 1. Authorization scoping
    if (currentUser) {
      if (currentUser.role === 'student') {
        // Students can only see their own complaints
        allComplaints = allComplaints.filter((c) => c.studentId === currentUser.id);
      } else if (currentUser.role === 'staff') {
        // Staff see their department complaints, or complaints directly assigned to them
        // And sensitive complaints are restricted unless assigned directly or permitted
        allComplaints = allComplaints.filter((c) => {
          const isDept = c.departmentId === currentUser.departmentId;
          const isAssigned = c.assignedStaffId === currentUser.id;
          if (c.isSensitive) {
            return isAssigned; // sensitive issues only visible to the directly assigned staff
          }
          return isDept || isAssigned;
        });
      }
      // Admins have access across all departments
    }

    // 2. Filter out archived complaints unless requested
    allComplaints = allComplaints.filter((c) => !c.isArchived);

    // 3. Dynamic filters
    if (filters) {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        allComplaints = allComplaints.filter(
          (c) =>
            c.id.toLowerCase().includes(query) ||
            c.title.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            c.location.campusArea.toLowerCase().includes(query) ||
            c.studentName.toLowerCase().includes(query) ||
            c.studentRollNo.toLowerCase().includes(query)
        );
      }

      if (filters.status && filters.status !== 'all') {
        allComplaints = allComplaints.filter((c) => c.status === filters.status);
      }

      if (filters.priority && filters.priority !== 'all') {
        allComplaints = allComplaints.filter((c) => c.priority === filters.priority);
      }

      if (filters.categoryId && filters.categoryId !== 'all') {
        allComplaints = allComplaints.filter((c) => c.categoryId === filters.categoryId);
      }

      if (filters.departmentId && filters.departmentId !== 'all') {
        allComplaints = allComplaints.filter((c) => c.departmentId === filters.departmentId);
      }

      if (filters.assignedStaffId && filters.assignedStaffId !== 'all') {
        allComplaints = allComplaints.filter((c) => c.assignedStaffId === filters.assignedStaffId);
      }

      if (filters.isOverdue !== undefined) {
        allComplaints = allComplaints.filter((c) => c.isOverdue === filters.isOverdue);
      }

      if (filters.isSensitive !== undefined) {
        allComplaints = allComplaints.filter((c) => c.isSensitive === filters.isSensitive);
      }

      if (filters.dateFrom) {
        const fromTime = new Date(filters.dateFrom).getTime();
        allComplaints = allComplaints.filter((c) => new Date(c.createdAt).getTime() >= fromTime);
      }

      if (filters.dateTo) {
        const toTime = new Date(filters.dateTo).getTime();
        allComplaints = allComplaints.filter((c) => new Date(c.createdAt).getTime() <= toTime);
      }

      // Sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';

      allComplaints.sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = allComplaints.length;

    // Pagination
    if (filters?.page && filters?.pageSize) {
      const startIndex = (filters.page - 1) * filters.pageSize;
      allComplaints = allComplaints.slice(startIndex, startIndex + filters.pageSize);
    }

    return { complaints: allComplaints, total };
  }

  public async getComplaintById(id: string, currentUser?: User): Promise<Complaint | null> {
    const allComplaints = this.getStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
    const complaint = allComplaints.find((c) => c.id === id);
    if (!complaint) return null;

    // Authorization check
    if (currentUser) {
      if (currentUser.role === 'student' && complaint.studentId !== currentUser.id) {
        throw new Error('Access denied: You are not authorized to view this complaint.');
      }
      if (currentUser.role === 'staff') {
        const isDept = complaint.departmentId === currentUser.departmentId;
        const isAssigned = complaint.assignedStaffId === currentUser.id;
        if (complaint.isSensitive && !isAssigned) {
          throw new Error('Access denied: Sensitive complaint restricted.');
        }
        if (!isDept && !isAssigned) {
          throw new Error('Access denied: You can only view complaints for your department.');
        }
      }
    }

    return complaint;
  }

  public async createComplaint(
    data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'slaDeadline' | 'isOverdue' | 'reopenCount' | 'isArchived'>,
    currentUser: User
  ): Promise<Complaint> {
    const allComplaints = this.getStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);

    // Generate readable ID
    const year = new Date().getFullYear();
    const nextNum = 1000 + allComplaints.length + 1;
    const complaintId = `CCMS-${year}-${nextNum}`;

    const now = new Date().toISOString();

    // Compute SLA Deadline based on priority
    const slaRules = await this.getSLARules();
    const rule = slaRules.find((r) => r.priority === data.priority) || { resolutionTargetHours: 72 };
    const deadlineDate = new Date(Date.now() + rule.resolutionTargetHours * 60 * 60 * 1000);

    const newComplaint: Complaint = {
      ...data,
      id: complaintId,
      reopenCount: 0,
      isArchived: false,
      isOverdue: false,
      slaDeadline: deadlineDate.toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    allComplaints.unshift(newComplaint);
    this.setStored(STORAGE_KEYS.COMPLAINTS, allComplaints);

    // Record initial status history
    await this.addStatusHistory({
      complaintId,
      toStatus: newComplaint.status,
      changedById: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      remarks: 'Complaint submitted by student',
    });

    // Record audit log
    await this.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'COMPLAINT_CREATED',
      entityType: 'complaint',
      entityId: complaintId,
      details: `Created complaint "${newComplaint.title}" [${newComplaint.priority.toUpperCase()}]`,
    });

    return newComplaint;
  }

  public async updateComplaint(id: string, updates: Partial<Complaint>, currentUser: User): Promise<Complaint> {
    const allComplaints = this.getStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
    const index = allComplaints.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Complaint with ID ${id} not found.`);
    }

    const current = allComplaints[index];
    const now = new Date().toISOString();

    const updatedComplaint: Complaint = {
      ...current,
      ...updates,
      updatedAt: now,
    };

    allComplaints[index] = updatedComplaint;
    this.setStored(STORAGE_KEYS.COMPLAINTS, allComplaints);

    // Audit log
    await this.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'COMPLAINT_UPDATED',
      entityType: 'complaint',
      entityId: id,
      details: `Updated complaint fields: ${Object.keys(updates).join(', ')}`,
    });

    return updatedComplaint;
  }

  public async archiveComplaint(id: string, currentUser: User): Promise<boolean> {
    if (currentUser.role !== 'admin') {
      throw new Error('Access denied: Only administrators can archive complaints.');
    }
    const allComplaints = this.getStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
    const index = allComplaints.findIndex((c) => c.id === id);
    if (index === -1) return false;

    allComplaints[index].isArchived = true;
    allComplaints[index].updatedAt = new Date().toISOString();
    this.setStored(STORAGE_KEYS.COMPLAINTS, allComplaints);

    await this.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'COMPLAINT_ARCHIVED',
      entityType: 'complaint',
      entityId: id,
      details: 'Complaint archived by administrator',
    });

    return true;
  }

  // --- Status History ---

  public async getStatusHistory(complaintId: string): Promise<StatusHistoryEntry[]> {
    const history = this.getStored<StatusHistoryEntry[]>(STORAGE_KEYS.STATUS_HISTORY, []);
    return history
      .filter((h) => h.complaintId === complaintId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public async addStatusHistory(entry: Omit<StatusHistoryEntry, 'id' | 'timestamp'>): Promise<StatusHistoryEntry> {
    const history = this.getStored<StatusHistoryEntry[]>(STORAGE_KEYS.STATUS_HISTORY, []);
    const newEntry: StatusHistoryEntry = {
      ...entry,
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    history.push(newEntry);
    this.setStored(STORAGE_KEYS.STATUS_HISTORY, history);
    return newEntry;
  }

  // --- Comments ---

  public async getComments(complaintId: string, currentUser?: User): Promise<Comment[]> {
    const comments = this.getStored<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    let filtered = comments.filter((c) => c.complaintId === complaintId);

    // If student, do not show internal staff notes
    if (currentUser && currentUser.role === 'student') {
      filtered = filtered.filter((c) => !c.isInternal);
    }

    return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public async addComment(commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const comments = this.getStored<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const newComment: Comment = {
      ...commentData,
      id: `comm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    this.setStored(STORAGE_KEYS.COMMENTS, comments);
    return newComment;
  }

  // --- Feedback ---

  public async addFeedback(data: Omit<ComplaintFeedback, 'id' | 'submittedAt'>): Promise<ComplaintFeedback> {
    const allComplaints = this.getStored<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []);
    const index = allComplaints.findIndex((c) => c.id === data.complaintId);
    if (index === -1) {
      throw new Error('Complaint not found.');
    }

    const feedback: ComplaintFeedback = {
      ...data,
      id: `fb-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    allComplaints[index].feedback = feedback;
    allComplaints[index].status = 'closed'; // Accepting feedback closes the complaint
    allComplaints[index].updatedAt = new Date().toISOString();
    this.setStored(STORAGE_KEYS.COMPLAINTS, allComplaints);

    await this.addStatusHistory({
      complaintId: data.complaintId,
      fromStatus: 'resolved',
      toStatus: 'closed',
      changedById: data.studentId,
      changedByName: allComplaints[index].studentName,
      changedByRole: 'student',
      remarks: `Resolution accepted with ${data.rating}★ rating: "${data.comments || 'No comment'}"`,
    });

    return feedback;
  }

  // --- Categories & Departments ---

  public async getCategories(): Promise<ComplaintCategory[]> {
    return this.getStored<ComplaintCategory[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  public async createCategory(category: Omit<ComplaintCategory, 'id'>, currentUser: User): Promise<ComplaintCategory> {
    if (currentUser.role !== 'admin') throw new Error('Unauthorized');
    const categories = await this.getCategories();
    const newCat: ComplaintCategory = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    categories.push(newCat);
    this.setStored(STORAGE_KEYS.CATEGORIES, categories);
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<ComplaintCategory>, currentUser: User): Promise<ComplaintCategory> {
    if (currentUser.role !== 'admin') throw new Error('Unauthorized');
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');
    categories[index] = { ...categories[index], ...updates };
    this.setStored(STORAGE_KEYS.CATEGORIES, categories);
    return categories[index];
  }

  public async getDepartments(): Promise<Department[]> {
    return this.getStored<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  }

  public async createDepartment(department: Omit<Department, 'id'>, currentUser: User): Promise<Department> {
    if (currentUser.role !== 'admin') throw new Error('Unauthorized');
    const depts = await this.getDepartments();
    const newDept: Department = {
      ...department,
      id: `dept-${Date.now()}`,
    };
    depts.push(newDept);
    this.setStored(STORAGE_KEYS.DEPARTMENTS, depts);
    return newDept;
  }

  public async updateDepartment(id: string, updates: Partial<Department>, currentUser: User): Promise<Department> {
    if (currentUser.role !== 'admin') throw new Error('Unauthorized');
    const depts = await this.getDepartments();
    const index = depts.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Department not found');
    depts[index] = { ...depts[index], ...updates };
    this.setStored(STORAGE_KEYS.DEPARTMENTS, depts);
    return depts[index];
  }

  // --- Users ---

  public async getUsers(): Promise<User[]> {
    return this.getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  public async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === id) || null;
  }

  public async createUser(user: Omit<User, 'id' | 'createdAt'>, currentUser: User): Promise<User> {
    if (currentUser.role !== 'admin') throw new Error('Unauthorized');
    const users = await this.getUsers();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.setStored(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<User>, currentUser: User): Promise<User> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');

    // Only self or admin can update
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new Error('Unauthorized to update this user.');
    }

    users[index] = { ...users[index], ...updates };
    this.setStored(STORAGE_KEYS.USERS, users);
    return users[index];
  }

  // --- Notifications ---

  public async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = this.getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
    const notifications = this.getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(newNotif);
    this.setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return newNotif;
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    const notifications = this.getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const index = notifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      this.setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    const notifications = this.getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    this.setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  // --- SLA Rules & Audit Logs ---

  public async getSLARules(): Promise<SLARule[]> {
    return this.getStored<SLARule[]>(STORAGE_KEYS.SLA_RULES, INITIAL_SLA_RULES);
  }

  public async updateSLARules(rules: SLARule[], currentUser: User): Promise<SLARule[]> {
    if (currentUser.role !== 'admin') throw new Error('Unauthorized');
    this.setStored(STORAGE_KEYS.SLA_RULES, rules);
    await this.addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SLA_RULES_UPDATED',
      entityType: 'sla_rule',
      entityId: 'global',
      details: 'Updated SLA targets across priority matrix',
    });
    return rules;
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    const logs = this.getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const logs = this.getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    this.setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  }
}
