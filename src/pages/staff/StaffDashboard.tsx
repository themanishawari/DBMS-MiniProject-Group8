import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  Filter,
  ShieldAlert,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { StatCard } from '../../components/common/StatCard';
import { StatusChangeModal } from '../../components/complaint/StatusChangeModal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ComplaintService } from '../../services/ComplaintService';
import { Complaint, ComplaintStatus } from '../../types';

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status modal state
  const [statusModalComplaint, setStatusModalComplaint] = useState<Complaint | null>(null);

  const fetchDepartmentComplaints = async () => {
    setIsLoading(true);
    try {
      const { complaints: list } = await complaintRepository.getComplaints({}, currentUser);
      setComplaints(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentComplaints();
  }, [currentUser]);

  // Compute metrics
  const total = complaints.length;
  const pendingAck = complaints.filter((c) => c.status === 'submitted').length;
  const inProgress = complaints.filter(
    (c) => c.status === 'acknowledged' || c.status === 'assigned' || c.status === 'in_progress'
  ).length;
  const escalatedOrOverdue = complaints.filter(
    (c) => c.status === 'escalated' || c.isOverdue
  ).length;
  const resolved = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;

  const handleStatusUpdate = async (newStatus: ComplaintStatus, remarks: string, resolutionAction?: string) => {
    if (!statusModalComplaint) return;
    await ComplaintService.transitionStatus(
      statusModalComplaint.id,
      newStatus,
      remarks,
      currentUser,
      resolutionAction
    );
    await fetchDepartmentComplaints();
  };

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-medium mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Department Operations Queue</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {currentUser.departmentName || 'Campus Works & IT Operations'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as <strong>{currentUser.name}</strong> • Department Staff Queue
          </p>
        </div>

        <Link to="/staff/assigned">
          <Button
            size="md"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
            icon={<FileCheck2 className="w-4 h-4" />}
          >
            Manage Queue ({total})
          </Button>
        </Link>
      </div>

      {/* SLA Breach Alert banner if any escalated/overdue */}
      {escalatedOrOverdue > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-rose-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Attention Required: {escalatedOrOverdue} Ticket(s) Escalated or Overdue</p>
              <p className="text-rose-800 text-[11px] mt-0.5">
                Tickets exceeding target SLA parameters have been flagged for administrative review.
              </p>
            </div>
          </div>
          <Link to="/staff/escalations">
            <Button size="sm" variant="danger" className="shrink-0 text-xs">
              View Escalation Queue →
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Dept Queue"
          value={total}
          subtitle="Total assigned tickets"
          icon={<Wrench className="w-5 h-5" />}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-700"
        />
        <StatCard
          label="Awaiting Ack"
          value={pendingAck}
          subtitle="Requires acknowledgment"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          subtitle="Under physical repair"
          icon={<UserCheck className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Escalated / Overdue"
          value={escalatedOrOverdue}
          subtitle="Breached SLA deadline"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
        <StatCard
          label="Resolved Tickets"
          value={resolved}
          subtitle="Awaiting/closed"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Action Table: Department Complaints */}
      <Card>
        <CardHeader
          title="Active Complaints Requiring Action"
          subtitle="Review incoming student reports, update progress, and record resolution details"
          action={
            <Link to="/staff/assigned" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              All Department Records <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading department queue...</div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No Pending Department Complaints"
              description="Your department queue is completely clear! All reported tickets have been addressed."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Student & Location</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SLA Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.slice(0, 10).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{c.studentName}</p>
                        <p className="text-[11px] text-slate-400">
                          {c.location.campusArea} • {c.location.roomNumber || c.location.building}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/staff/complaints/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 truncate block"
                        >
                          {c.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">{c.subcategoryName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-medium ${
                            c.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {new Date(c.slaDeadline).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setStatusModalComplaint(c)}
                        >
                          Update Status
                        </Button>
                        <Link to={`/staff/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Change Modal */}
      {statusModalComplaint && (
        <StatusChangeModal
          isOpen={!!statusModalComplaint}
          onClose={() => setStatusModalComplaint(null)}
          complaint={statusModalComplaint}
          currentUser={currentUser}
          onSubmit={handleStatusUpdate}
        />
      )}
    </div>
  );
};
