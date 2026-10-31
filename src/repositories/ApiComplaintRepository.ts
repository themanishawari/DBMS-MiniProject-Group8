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

export class ApiComplaintRepository implements IComplaintRepository {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('ccms_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.detail) {
          errorMessage = errorData.message || errorData.detail;
        }
      } catch {
        // Non-JSON response
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  public async getComplaints(
    filters?: ComplaintFilterOptions,
    _currentUser?: User
  ): Promise<{ complaints: Complaint[]; total: number }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== 'all') {
          params.append(key, String(val));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ complaints: Complaint[]; total: number }>(`/complaints${query}`);
  }

  public async getComplaintById(id: string, _currentUser?: User): Promise<Complaint | null> {
    return this.request<Complaint>(`/complaints/${id}`);
  }

  public async createComplaint(
    complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'slaDeadline' | 'isOverdue' | 'reopenCount' | 'isArchived'>,
    _currentUser: User
  ): Promise<Complaint> {
    return this.request<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
  }

  public async updateComplaint(id: string, updates: Partial<Complaint>, _currentUser: User): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async archiveComplaint(id: string, _currentUser: User): Promise<boolean> {
    await this.request(`/complaints/${id}/archive`, { method: 'POST' });
    return true;
  }

  public async getStatusHistory(complaintId: string): Promise<StatusHistoryEntry[]> {
    return this.request<StatusHistoryEntry[]>(`/complaints/${complaintId}/history`);
  }

  public async addStatusHistory(entry: Omit<StatusHistoryEntry, 'id' | 'timestamp'>): Promise<StatusHistoryEntry> {
    return this.request<StatusHistoryEntry>(`/complaints/${entry.complaintId}/history`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  public async getComments(complaintId: string, _currentUser?: User): Promise<Comment[]> {
    return this.request<Comment[]>(`/complaints/${complaintId}/comments`);
  }

  public async addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    return this.request<Comment>(`/complaints/${comment.complaintId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  public async addFeedback(feedback: Omit<ComplaintFeedback, 'id' | 'submittedAt'>): Promise<ComplaintFeedback> {
    return this.request<ComplaintFeedback>(`/complaints/${feedback.complaintId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  public async getCategories(): Promise<ComplaintCategory[]> {
    return this.request<ComplaintCategory[]>('/categories');
  }

  public async createCategory(category: Omit<ComplaintCategory, 'id'>, _currentUser: User): Promise<ComplaintCategory> {
    return this.request<ComplaintCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  public async updateCategory(id: string, updates: Partial<ComplaintCategory>, _currentUser: User): Promise<ComplaintCategory> {
    return this.request<ComplaintCategory>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async getDepartments(): Promise<Department[]> {
    return this.request<Department[]>('/departments');
  }

  public async createDepartment(department: Omit<Department, 'id'>, _currentUser: User): Promise<Department> {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  }

  public async updateDepartment(id: string, updates: Partial<Department>, _currentUser: User): Promise<Department> {
    return this.request<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  public async getUserById(id: string): Promise<User | null> {
    return this.request<User>(`/users/${id}`);
  }

  public async createUser(user: Omit<User, 'id' | 'createdAt'>, _currentUser: User): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  public async updateUser(id: string, updates: Partial<User>, _currentUser: User): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  public async getNotifications(userId: string): Promise<Notification[]> {
    return this.request<Notification[]>(`/notifications?userId=${userId}`);
  }

  public async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
    return this.request<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  public async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.request(`/notifications/read-all?userId=${userId}`, { method: 'POST' });
  }

  public async getSLARules(): Promise<SLARule[]> {
    return this.request<SLARule[]>('/sla-rules');
  }

  public async updateSLARules(rules: SLARule[], _currentUser: User): Promise<SLARule[]> {
    return this.request<SLARule[]>('/sla-rules', {
      method: 'PUT',
      body: JSON.stringify(rules),
    });
  }

  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/audit-logs');
  }

  public async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return this.request<AuditLog>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  public async resetToInitialSeed(): Promise<void> {
    await this.request('/dev/reset', { method: 'POST' });
  }
}
