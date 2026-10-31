import { beforeEach, describe, expect, it } from 'vitest';
import { ALLOWED_TRANSITIONS, STATUS_CONFIG } from '../data/constants';
import { INITIAL_USERS } from '../data/initialSeed';
import { complaintRepository } from '../repositories';
import { AnalyticsService } from '../services/AnalyticsService';
import { ComplaintService } from '../services/ComplaintService';

describe('College Complaint Management System (CCMS) Core Tests', () => {
  const studentUser = INITIAL_USERS[0]; // Rahul Sharma (Student)
  const staffUser = INITIAL_USERS[3];   // Vikram Verma (IT Staff)
  const adminUser = INITIAL_USERS[6];   // Prof. David Miller (Admin)

  beforeEach(async () => {
    // Reset seed before each test
    await complaintRepository.resetToInitialSeed();
  });

  describe('1. Complaint Submission & Validation', () => {
    it('rejects invalid complaint with short title or description', () => {
      const result = ComplaintService.validateComplaintSubmission({
        title: 'Bad',
        description: 'Too short',
        categoryId: 'cat-it',
        subcategoryId: 'sub-it-1',
        departmentId: 'dept-it',
        campusArea: 'Academic Block A',
        termsAgreed: false,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBeDefined();
      expect(result.errors.description).toBeDefined();
      expect(result.errors.termsAgreed).toBeDefined();
    });

    it('successfully submits valid complaint and assigns unique readable ID', async () => {
      const complaint = await ComplaintService.submitComplaint(
        {
          title: 'Wi-Fi disconnects frequently during online lab submissions',
          description: 'Students in Computer Lab 2 experience intermittent signal drops every 10 minutes when accessing the campus exam portal.',
          categoryId: 'cat-it',
          categoryName: 'IT and Technical Issues',
          subcategoryId: 'sub-it-1',
          subcategoryName: 'Wi-Fi & Internet Connectivity',
          departmentId: 'dept-it',
          departmentName: 'IT Services & Network Infrastructure',
          priority: 'high',
          location: {
            campusArea: 'Academic Block A (Computer & IT)',
            building: 'Software Lab Annex',
            floor: '2nd Floor',
            roomNumber: 'Lab 204',
          },
          attachments: [],
          preferredContact: 'portal',
          isSensitive: false,
        },
        studentUser
      );

      expect(complaint.id).toMatch(/^CCMS-\d{4}-\d+/);
      expect(complaint.status).toBe('submitted');
      expect(complaint.studentId).toBe(studentUser.id);
      expect(complaint.slaDeadline).toBeDefined();
    });
  });

  describe('2. Workflow & Status Transitions', () => {
    it('allows department staff to acknowledge and resolve complaint with action taken', async () => {
      // Create new ticket
      const ticket = await ComplaintService.submitComplaint(
        {
          title: 'Defective projector lamp in Lecture Theatre 101',
          description: 'The overhead video display flickers with yellow tint, preventing presentations.',
          categoryId: 'cat-it',
          categoryName: 'IT and Technical Issues',
          subcategoryId: 'sub-it-5',
          subcategoryName: 'Smart Classroom Audio/Projector',
          departmentId: 'dept-it',
          departmentName: 'IT Services & Network Infrastructure',
          priority: 'medium',
          location: {
            campusArea: 'Academic Block A (Computer & IT)',
            building: 'Main Tower',
            floor: '1st Floor',
            roomNumber: 'LT 101',
          },
          attachments: [],
          preferredContact: 'portal',
          isSensitive: false,
        },
        studentUser
      );

      // Staff acknowledges
      const acked = await ComplaintService.transitionStatus(
        ticket.id,
        'acknowledged',
        'Acknowledged by IT Helpdesk technician',
        staffUser
      );
      expect(acked.status).toBe('acknowledged');

      // Staff sets in_progress
      const inProg = await ComplaintService.transitionStatus(
        ticket.id,
        'in_progress',
        'Technician dispatched with replacement bulb',
        staffUser
      );
      expect(inProg.status).toBe('in_progress');

      // Staff resolves
      const resolved = await ComplaintService.transitionStatus(
        ticket.id,
        'resolved',
        'Replacement completed and display calibrated',
        staffUser,
        'Replaced 240W projector lamp module and tested HDMI 1080p output.'
      );
      expect(resolved.status).toBe('resolved');
      expect(resolved.resolutionDetails?.actionTaken).toContain('Replaced 240W');
    });

    it('enforces status transition permissions and prevents unauthorized jumps', async () => {
      // Student cannot arbitrarily resolve submitted complaints directly
      const { complaints } = await complaintRepository.getComplaints({}, studentUser);
      const submittedTicket = complaints.find((c) => c.status === 'submitted') || complaints[0];

      await expect(
        ComplaintService.transitionStatus(
          submittedTicket.id,
          'resolved',
          'Attempting direct resolution',
          studentUser,
          'Action'
        )
      ).rejects.toThrow();
    });
  });

  describe('3. Role-Based Scoping & Privacy', () => {
    it('scopes complaints so students only see their own records', async () => {
      const studentData = await complaintRepository.getComplaints({}, studentUser);
      studentData.complaints.forEach((c) => {
        expect(c.studentId).toBe(studentUser.id);
      });
    });

    it('permits administrators global oversight across all departments', async () => {
      const adminData = await complaintRepository.getComplaints({}, adminUser);
      expect(adminData.complaints.length).toBeGreaterThan(15);
    });
  });

  describe('4. Institutional Analytics Calculation', () => {
    it('calculates KPIs directly from actual records rather than static placeholders', async () => {
      const analytics = await AnalyticsService.getAnalytics(adminUser);

      expect(analytics.totalComplaints).toBeGreaterThan(20);
      expect(analytics.resolvedComplaints).toBeGreaterThan(0);
      expect(analytics.averageResolutionTimeHours).toBeGreaterThan(0);
      expect(analytics.departmentPerformance.length).toBeGreaterThan(0);
      expect(analytics.categoryDistribution.length).toBeGreaterThan(0);
    });
  });
});
