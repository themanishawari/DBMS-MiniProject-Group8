import { ALLOWED_TRANSITIONS, STATUS_CONFIG } from '../data/constants';
import { complaintRepository } from '../repositories';
import {
  Comment,
  Complaint,
  ComplaintFeedback,
  ComplaintFilterOptions,
  ComplaintPriority,
  ComplaintStatus,
  StatusHistoryEntry,
  User,
} from '../types';
import { NotificationService } from './NotificationService';

export class ComplaintService {
  /**
   * Validate new complaint data before submission
   */
  public static validateComplaintSubmission(data: {
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    departmentId: string;
    campusArea: string;
    termsAgreed: boolean;
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.trim().length < 6) {
      errors.title = 'Complaint title must be at least 6 characters.';
    } else if (data.title.length > 150) {
      errors.title = 'Complaint title cannot exceed 150 characters.';
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.description = 'Please describe the issue in detail (at least 20 characters).';
    } else if (data.description.length > 2000) {
      errors.description = 'Complaint description cannot exceed 2000 characters.';
    }

    if (!data.categoryId) {
      errors.categoryId = 'Please select a complaint category.';
    }

    if (!data.subcategoryId) {
      errors.subcategoryId = 'Please select a subcategory.';
    }

    if (!data.departmentId) {
      errors.departmentId = 'Department assignment is required.';
    }

    if (!data.campusArea || !data.campusArea.trim()) {
      errors.campusArea = 'Please specify the campus area or building.';
    }

    if (!data.termsAgreed) {
      errors.termsAgreed = 'You must confirm that the information provided is accurate.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Submit a new complaint
   */
  public static async submitComplaint(
    payload: {
      title: string;
      description: string;
      categoryId: string;
      categoryName: string;
      subcategoryId: string;
      subcategoryName: string;
      departmentId: string;
      departmentName: string;
      priority: ComplaintPriority;
      location: Complaint['location'];
      attachments: Complaint['attachments'];
      preferredContact: Complaint['preferredContact'];
      isSensitive: boolean;
    },
    currentUser: User
  ): Promise<Complaint> {
    if (currentUser.role !== 'student') {
      throw new Error('Only students can submit complaints.');
    }

    const complaint = await complaintRepository.createComplaint(
      {
        title: payload.title.trim(),
        description: payload.description.trim(),
        categoryId: payload.categoryId,
        categoryName: payload.categoryName,
        subcategoryId: payload.subcategoryId,
        subcategoryName: payload.subcategoryName,
        departmentId: payload.departmentId,
        departmentName: payload.departmentName,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        studentRollNo: currentUser.studentId || 'N/A',
        priority: payload.priority || 'medium',
        status: 'submitted',
        location: payload.location,
        attachments: payload.attachments || [],
        preferredContact: payload.preferredContact || 'portal',
        isSensitive: payload.isSensitive || false,
      },
      currentUser
    );

    // Notify student of successful registration
    await NotificationService.sendInAppNotification(
      currentUser.id,
      `Complaint Registered: ${complaint.id}`,
      `Your complaint "${complaint.title}" has been successfully logged and routed to ${complaint.departmentName}.`,
      'status_update',
      complaint.id
    );

    // Notify department staff
    const users = await complaintRepository.getUsers();
    const deptStaff = users.filter((u) => u.departmentId === complaint.departmentId && u.role === 'staff');
    for (const staff of deptStaff) {
      await NotificationService.sendInAppNotification(
        staff.id,
        `New Department Ticket: ${complaint.id}`,
        `A new ${complaint.priority.toUpperCase()} priority complaint has been submitted: "${complaint.title}".`,
        'assignment',
        complaint.id
      );
    }

    return complaint;
  }

  /**
   * Transition complaint to a new status enforcing state machine rules
   */
  public static async transitionStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    remarks: string,
    currentUser: User,
    resolutionAction?: string
  ): Promise<Complaint> {
    const complaint = await complaintRepository.getComplaintById(complaintId, currentUser);
    if (!complaint) {
      throw new Error(`Complaint with ID ${complaintId} not found.`);
    }

    const currentStatus = complaint.status;
    const transitionRule = ALLOWED_TRANSITIONS[currentStatus];

    if (!transitionRule || !transitionRule.nextStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status change: Cannot transition from "${STATUS_CONFIG[currentStatus].label}" to "${STATUS_CONFIG[newStatus].label}".`
      );
    }

    if (!transitionRule.allowedRoles.includes(currentUser.role)) {
      throw new Error(
        `Permission denied: Your role (${currentUser.role}) is not authorized to transition to "${STATUS_CONFIG[newStatus].label}".`
      );
    }

    if (!remarks || remarks.trim().length < 5) {
      throw new Error('Please provide status change remarks (minimum 5 characters).');
    }

    const updates: Partial<Complaint> = {
      status: newStatus,
    };

    // If resolving, record resolution details
    if (newStatus === 'resolved') {
      if (!resolutionAction || resolutionAction.trim().length < 10) {
        throw new Error('Please provide the action taken to resolve this complaint (at least 10 characters).');
      }
      updates.resolutionDetails = {
        resolvedAt: new Date().toISOString(),
        resolvedById: currentUser.id,
        resolvedByName: currentUser.name,
        actionTaken: resolutionAction.trim(),
      };
    }

    // If student is reopening
    if (newStatus === 'reopened') {
      updates.reopenCount = (complaint.reopenCount || 0) + 1;
      updates.lastReopenedAt = new Date().toISOString();
      updates.reopenReason = remarks;
    }

    const updated = await complaintRepository.updateComplaint(complaintId, updates, currentUser);

    // Record in history audit
    await complaintRepository.addStatusHistory({
      complaintId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      changedById: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      remarks: remarks.trim(),
    });

    // Notify student about status change
    await NotificationService.sendInAppNotification(
      complaint.studentId,
      `Status Update: ${complaint.id}`,
      `Your complaint status has been changed to "${STATUS_CONFIG[newStatus].label}". Remarks: ${remarks}`,
      'status_update',
      complaint.id
    );

    return updated;
  }

  /**
   * Assign or reassign complaint to a department and specific handler
   */
  public static async assignComplaint(
    complaintId: string,
    departmentId: string,
    departmentName: string,
    assignedStaffId?: string,
    assignedStaffName?: string,
    remarks?: string,
    currentUser?: User
  ): Promise<Complaint> {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'staff')) {
      throw new Error('Unauthorized: Only administrators or department leads can assign complaints.');
    }

    const complaint = await complaintRepository.getComplaintById(complaintId, currentUser);
    if (!complaint) throw new Error('Complaint not found.');

    const updates: Partial<Complaint> = {
      departmentId,
      departmentName,
      assignedStaffId: assignedStaffId || undefined,
      assignedStaffName: assignedStaffName || undefined,
      status: complaint.status === 'submitted' ? 'assigned' : complaint.status,
    };

    const updated = await complaintRepository.updateComplaint(complaintId, updates, currentUser);

    await complaintRepository.addStatusHistory({
      complaintId,
      fromStatus: complaint.status,
      toStatus: updated.status,
      changedById: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      remarks:
        remarks ||
        `Assigned to department: ${departmentName}${assignedStaffName ? ` (Handler: ${assignedStaffName})` : ''}`,
    });

    // If a staff member was assigned, notify them
    if (assignedStaffId) {
      await NotificationService.sendInAppNotification(
        assignedStaffId,
        `Assigned to Complaint ${complaint.id}`,
        `You have been assigned to handle complaint "${complaint.title}".`,
        'assignment',
        complaint.id
      );
    }

    return updated;
  }

  /**
   * Change priority with administrative authorization
   */
  public static async changePriority(
    complaintId: string,
    newPriority: ComplaintPriority,
    justification: string,
    currentUser: User
  ): Promise<Complaint> {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can adjust complaint priority.');
    }

    if (!justification || justification.trim().length < 5) {
      throw new Error('Justification is required to change priority.');
    }

    const complaint = await complaintRepository.getComplaintById(complaintId, currentUser);
    if (!complaint) throw new Error('Complaint not found.');

    const slaRules = await complaintRepository.getSLARules();
    const rule = slaRules.find((r) => r.priority === newPriority) || { resolutionTargetHours: 72 };
    const newDeadline = new Date(Date.now() + rule.resolutionTargetHours * 60 * 60 * 1000).toISOString();

    const updated = await complaintRepository.updateComplaint(
      complaintId,
      {
        priority: newPriority,
        slaDeadline: newDeadline,
      },
      currentUser
    );

    await complaintRepository.addStatusHistory({
      complaintId,
      fromStatus: complaint.status,
      toStatus: complaint.status,
      changedById: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      remarks: `Priority updated from ${complaint.priority.toUpperCase()} to ${newPriority.toUpperCase()}. Justification: ${justification}`,
    });

    return updated;
  }

  /**
   * Manual escalation
   */
  public static async escalateComplaint(
    complaintId: string,
    escalationReason: string,
    currentUser: User
  ): Promise<Complaint> {
    if (!escalationReason || escalationReason.trim().length < 10) {
      throw new Error('Please provide a detailed escalation reason (at least 10 characters).');
    }

    return this.transitionStatus(complaintId, 'escalated', `ESCALATION: ${escalationReason}`, currentUser);
  }

  /**
   * Submit resolution feedback
   */
  public static async submitFeedback(
    complaintId: string,
    rating: number,
    comments: string,
    currentUser: User
  ): Promise<ComplaintFeedback> {
    if (currentUser.role !== 'student') {
      throw new Error('Only the student who submitted the complaint can provide feedback.');
    }

    const complaint = await complaintRepository.getComplaintById(complaintId, currentUser);
    if (!complaint) throw new Error('Complaint not found.');

    if (complaint.studentId !== currentUser.id) {
      throw new Error('Access denied.');
    }

    if (complaint.status !== 'resolved') {
      throw new Error('Feedback can only be submitted for resolved complaints.');
    }

    return complaintRepository.addFeedback({
      complaintId,
      studentId: currentUser.id,
      rating,
      comments: comments.trim(),
    });
  }

  /**
   * Add a comment or internal staff note
   */
  public static async addComment(
    complaintId: string,
    content: string,
    isInternal: boolean,
    currentUser: User
  ): Promise<Comment> {
    if (!content || !content.trim()) {
      throw new Error('Comment cannot be empty.');
    }

    if (isInternal && currentUser.role === 'student') {
      throw new Error('Students cannot post internal staff notes.');
    }

    const complaint = await complaintRepository.getComplaintById(complaintId, currentUser);
    if (!complaint) throw new Error('Complaint not found.');

    const newComment = await complaintRepository.addComment({
      complaintId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      content: content.trim(),
      isInternal,
    });

    // Notify relevant party
    if (!isInternal) {
      if (currentUser.role === 'student') {
        // Notify assigned staff
        if (complaint.assignedStaffId) {
          await NotificationService.sendInAppNotification(
            complaint.assignedStaffId,
            `New Student Comment on ${complaint.id}`,
            `${currentUser.name}: "${content.substring(0, 60)}..."`,
            'comment',
            complaint.id
          );
        }
      } else {
        // Notify student
        await NotificationService.sendInAppNotification(
          complaint.studentId,
          `New Comment on ${complaint.id}`,
          `${currentUser.name} (${currentUser.role.toUpperCase()}): "${content.substring(0, 60)}..."`,
          'comment',
          complaint.id
        );
      }
    }

    return newComment;
  }

  /**
   * Search and filter complaints with permissions check
   */
  public static async getComplaints(filters?: ComplaintFilterOptions, currentUser?: User) {
    return complaintRepository.getComplaints(filters, currentUser);
  }

  /**
   * Get single complaint with full details and history
   */
  public static async getComplaintDetails(complaintId: string, currentUser?: User) {
    const complaint = await complaintRepository.getComplaintById(complaintId, currentUser);
    if (!complaint) return null;

    const [history, comments] = await Promise.all([
      complaintRepository.getStatusHistory(complaintId),
      complaintRepository.getComments(complaintId, currentUser),
    ]);

    return {
      complaint,
      history,
      comments,
    };
  }
}
