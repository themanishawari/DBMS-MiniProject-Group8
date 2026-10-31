import { ComplaintPriority, ComplaintStatus, Role } from '../types';

export const STATUS_CONFIG: Record<
  ComplaintStatus,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
    text: string;
    stepIndex: number;
  }
> = {
  submitted: {
    label: 'Submitted',
    description: 'Complaint received and pending initial review',
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    stepIndex: 1,
  },
  acknowledged: {
    label: 'Acknowledged',
    description: 'Complaint reviewed by department administration',
    color: 'blue',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    stepIndex: 2,
  },
  assigned: {
    label: 'Assigned',
    description: 'Assigned to a specific staff member or team',
    color: 'indigo',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    stepIndex: 3,
  },
  in_progress: {
    label: 'In Progress',
    description: 'Active investigation or physical repair underway',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    stepIndex: 4,
  },
  awaiting_student_response: {
    label: 'Awaiting Info',
    description: 'Additional clarification or verification needed from student',
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    stepIndex: 4,
  },
  escalated: {
    label: 'Escalated',
    description: 'Escalated to senior authority due to SLA breach or complexity',
    color: 'rose',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    stepIndex: 4,
  },
  resolved: {
    label: 'Resolved',
    description: 'Issue addressed and resolved by handler; awaiting student verification',
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    stepIndex: 5,
  },
  closed: {
    label: 'Closed',
    description: 'Resolution accepted by student or closed after feedback period',
    color: 'gray',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-800',
    stepIndex: 6,
  },
  reopened: {
    label: 'Reopened',
    description: 'Student indicated issue persists; returned for immediate review',
    color: 'orange',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    stepIndex: 4,
  },
  rejected: {
    label: 'Rejected',
    description: 'Complaint rejected (e.g. invalid, duplicate, or out of scope)',
    color: 'red',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    stepIndex: 6,
  },
};

export const PRIORITY_CONFIG: Record<
  ComplaintPriority,
  {
    label: string;
    slaHours: number;
    bg: string;
    text: string;
    border: string;
    dotColor: string;
  }
> = {
  low: {
    label: 'Low',
    slaHours: 120, // 5 days
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    slaHours: 72, // 3 days
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  high: {
    label: 'High',
    slaHours: 48, // 2 days
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    slaHours: 24, // 1 day
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dotColor: 'bg-red-600',
  },
};

// Valid Workflow Status Transitions Matrix
// Dictates allowed state movements based on current status and user role
export const ALLOWED_TRANSITIONS: Record<
  ComplaintStatus,
  { nextStatuses: ComplaintStatus[]; allowedRoles: Role[] }
> = {
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
    allowedRoles: ['student', 'admin'], // Student accepts (closes) or reopens
  },
  closed: {
    nextStatuses: ['reopened'], // Only Admin can reopen a permanently closed case if exceptional
    allowedRoles: ['admin'],
  },
  reopened: {
    nextStatuses: ['in_progress', 'assigned', 'escalated', 'resolved'],
    allowedRoles: ['staff', 'admin'],
  },
  rejected: {
    nextStatuses: ['submitted'], // Only Admin can un-reject on appeal
    allowedRoles: ['admin'],
  },
};

export const CAMPUS_LOCATIONS = [
  { area: 'Academic Block A (Computer & IT)', buildings: ['Main Tower', 'Software Lab Annex'] },
  { area: 'Academic Block B (Mechanical & Civil)', buildings: ['Engineering Workshops', 'Hydraulics Lab'] },
  { area: 'Academic Block C (Electrical & Electronics)', buildings: ['Circuit Lab Complex', 'Robotics Wing'] },
  { area: 'Central Library Building', buildings: ['Reference Wing', 'Digital Study Hub'] },
  { area: 'Boys Hostel Complex (Hostel 1 & 2)', buildings: ['Block 1', 'Block 2', 'Dining Hall A'] },
  { area: 'Girls Hostel Complex (Hostel 3 & 4)', buildings: ['Block 3', 'Block 4', 'Dining Hall B'] },
  { area: 'Student Amenities & Sports Arena', buildings: ['Gymnasium', 'Cafeteria', 'Auditorium'] },
  { area: 'Administrative Block', buildings: ['Registrar Wing', 'Accounts Office', 'Dean Suite'] },
  { area: 'Campus Grounds & Transit', buildings: ['Main Bus Terminus', 'Parking Lot 1', 'Campus Perimeter'] },
];
