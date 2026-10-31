import { Complaint, User } from '../types';

export class ExportService {
  public static exportComplaintsToCSV(complaints: Complaint[], currentUser: User, filename = 'college-complaints-report.csv'): void {
    if (!complaints || complaints.length === 0) {
      throw new Error('No complaints available to export.');
    }

    // Role-based column filtering
    const headers = [
      'Complaint ID',
      'Title',
      'Category',
      'Subcategory',
      'Department',
      'Priority',
      'Status',
      'Campus Area',
      'Building/Room',
      'Created At',
      'Updated At',
      'SLA Deadline',
      'Is Overdue',
    ];

    if (currentUser.role === 'admin' || currentUser.role === 'staff') {
      headers.push('Student Name', 'Student Roll No', 'Student Email', 'Assigned Handler');
    }

    if (currentUser.role === 'admin') {
      headers.push('Is Sensitive', 'Reopen Count', 'Action Taken');
    }

    const rows = complaints.map((c) => {
      const row: string[] = [
        `"${c.id}"`,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.categoryName}"`,
        `"${c.subcategoryName}"`,
        `"${c.departmentName}"`,
        `"${c.priority.toUpperCase()}"`,
        `"${c.status.toUpperCase()}"`,
        `"${c.location.campusArea.replace(/"/g, '""')}"`,
        `"${(c.location.building || '') + ' ' + (c.location.roomNumber || '')}"`,
        `"${new Date(c.createdAt).toLocaleString()}"`,
        `"${new Date(c.updatedAt).toLocaleString()}"`,
        `"${new Date(c.slaDeadline).toLocaleString()}"`,
        `"${c.isOverdue ? 'YES' : 'NO'}"`,
      ];

      if (currentUser.role === 'admin' || currentUser.role === 'staff') {
        row.push(
          `"${c.studentName}"`,
          `"${c.studentRollNo}"`,
          `"${c.studentEmail}"`,
          `"${c.assignedStaffName || 'Unassigned'}"`
        );
      }

      if (currentUser.role === 'admin') {
        row.push(
          `"${c.isSensitive ? 'YES' : 'NO'}"`,
          `"${c.reopenCount}"`,
          `"${(c.resolutionDetails?.actionTaken || '').replace(/"/g, '""')}"`
        );
      }

      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
