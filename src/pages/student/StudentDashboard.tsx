import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock,
  FileCheck2,
  FilePlus2,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { complaintRepository } from '../../repositories';
import { Complaint } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { notifications } = useNotifications();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { complaints: list } = await complaintRepository.getComplaints({}, currentUser);
        setComplaints(list);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, [currentUser]);

  // Compute metrics for student
  const total = complaints.length;
  const pending = complaints.filter(
    (c) => c.status === 'submitted' || c.status === 'acknowledged'
  ).length;
  const inProgress = complaints.filter(
    (c) =>
      c.status === 'assigned' ||
      c.status === 'in_progress' ||
      c.status === 'awaiting_student_response' ||
      c.status === 'reopened' ||
      c.status === 'escalated'
  ).length;
  const resolved = complaints.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;

  const recentComplaints = complaints.slice(0, 5);
  const recentNotifs = notifications.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-medium mb-1">
            <span>Enrolled Student Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome, {currentUser.name}!</h2>
          <p className="text-xs text-slate-300 mt-1">
            Student ID: <span className="font-mono font-semibold">{currentUser.studentId || 'ENG-2024-CSE-042'}</span> •
            Campus Complaint & Redressal Center
          </p>
        </div>

        <Link to="/student/submit">
          <Button
            size="md"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shrink-0"
            icon={<FilePlus2 className="w-4 h-4" />}
          >
            Submit a Complaint
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Submitted"
          value={total}
          subtitle="All recorded grievances"
          icon={<FolderOpen className="w-5 h-5" />}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-700"
        />
        <StatCard
          label="Pending Review"
          value={pending}
          subtitle="Awaiting department acknowledgment"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          subtitle="Under active investigation"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Resolved / Closed"
          value={resolved}
          subtitle="Successfully addressed"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Main Grid: Recent Complaints & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Complaints Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Recent Complaints"
              subtitle="Track status, priority, and department assignments"
              action={
                <Link
                  to="/student/complaints"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  View All ({total}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading complaints...</div>
              ) : recentComplaints.length === 0 ? (
                <EmptyState
                  title="No Complaints Submitted Yet"
                  description="You have not reported any issues yet. Click below to submit a campus complaint."
                  actionLabel="Submit First Complaint"
                  onAction={() => (window.location.href = '/student/submit')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="py-3 px-4">Complaint ID</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {recentComplaints.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                            {c.id}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                            <p className="text-[11px] text-slate-500">{c.categoryName}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{c.departmentName}</td>
                          <td className="py-3 px-4">
                            <PriorityBadge priority={c.priority} size="sm" />
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={c.status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/student/complaints/${c.id}`}
                              className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Details →
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
        </div>

        {/* Right 1 Col: Recent Updates & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent className="space-y-2.5">
              <Link to="/student/submit" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs font-medium">
                  <Plus className="w-4 h-4 mr-2 text-indigo-600" />
                  Report New Infrastructure or IT Issue
                </Button>
              </Link>
              <Link to="/student/complaints?status=resolved" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Verify & Rate Resolved Complaints
                </Button>
              </Link>
              <Link to="/student/profile" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs font-medium">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Update Contact Preferences
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Activity Notifications */}
          <Card>
            <CardHeader
              title="Recent Activity Alerts"
              action={
                <Link to="/student/notifications" className="text-xs text-indigo-600 font-medium">
                  View All
                </Link>
              }
            />
            <CardContent className="p-0 divide-y divide-slate-100">
              {recentNotifs.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-500">
                  No notifications recorded yet.
                </div>
              ) : (
                recentNotifs.map((n) => (
                  <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                    <time className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
