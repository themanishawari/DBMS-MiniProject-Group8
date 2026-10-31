import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FolderOpen,
  MapPin,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import { CategoryBreakdownChart } from '../../components/analytics/CategoryBreakdownChart';
import { ComplaintTrendsChart } from '../../components/analytics/ComplaintTrendsChart';
import { DepartmentPerformanceChart } from '../../components/analytics/DepartmentPerformanceChart';
import { StatusDistributionChart } from '../../components/analytics/StatusDistributionChart';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { AnalyticsService, CCMSAnalyticsSummary } from '../../services/AnalyticsService';
import { ExportService } from '../../services/ExportService';
import { Complaint } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<CCMSAnalyticsSummary | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [stats, listData] = await Promise.all([
          AnalyticsService.getAnalytics(currentUser),
          complaintRepository.getComplaints({ pageSize: 6, sortBy: 'createdAt', sortOrder: 'desc' }, currentUser),
        ]);
        setAnalytics(stats);
        setRecentComplaints(listData.complaints);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleExportAll = async () => {
    try {
      const { complaints } = await complaintRepository.getComplaints({}, currentUser);
      ExportService.exportComplaintsToCSV(complaints, currentUser, `ccms-full-institutional-audit-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    }
  };

  if (isLoading || !analytics) {
    return <div className="py-20 text-center text-xs text-slate-500">Compiling institutional analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-medium mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Campus Administration & Oversight Hub</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Institutional Complaint Management Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1">
            Welcome, <strong>{currentUser.name}</strong> • Real-time SLA compliance, department queues & campus metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAll}
            className="text-white border-slate-700 hover:bg-slate-800"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export All CSV
          </Button>
          <Link to="/admin/complaints">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md"
              icon={<FileCheck2 className="w-4 h-4" />}
            >
              All Complaints
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Logged"
          value={analytics.totalComplaints}
          subtitle="All complaints"
          icon={<FolderOpen className="w-5 h-5" />}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-700"
        />
        <StatCard
          label="New / Review"
          value={analytics.newComplaints}
          subtitle="Submitted & Ack"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Active Tickets"
          value={analytics.activeComplaints}
          subtitle="Assigned / In Progress"
          icon={<AlertCircle className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="SLA Overdue"
          value={analytics.overdueComplaints}
          subtitle="Breached targets"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-600"
        />
        <StatCard
          label="Resolved / Closed"
          value={analytics.resolvedComplaints}
          subtitle="Completed actions"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Avg Resolution"
          value={`${analytics.averageResolutionTimeHours}h`}
          subtitle={`Satisfaction: ${analytics.satisfactionRatingAvg}★`}
          icon={<BarChart3 className="w-5 h-5" />}
          iconBgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Grid - 4 Key Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Volume */}
        <Card>
          <CardHeader
            title="Complaint Influx vs. Resolution Trends"
            subtitle="Monthly trajectory of reported issues versus completed resolutions"
          />
          <CardContent>
            <ComplaintTrendsChart data={analytics.monthlyTrends} />
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader
            title="Distribution by Category"
            subtitle="Total ticket volume across academic, IT, and infrastructure disciplines"
          />
          <CardContent>
            <CategoryBreakdownChart data={analytics.categoryDistribution} />
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader
            title="Department SLA & Resolution Performance"
            subtitle="Resolved tickets vs pending backlog per college department"
          />
          <CardContent>
            <DepartmentPerformanceChart data={analytics.departmentPerformance} />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader
            title="Current Status Distribution"
            subtitle="Proportion of tickets by active workflow states"
          />
          <CardContent>
            <StatusDistributionChart data={analytics.statusDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Complaint Hotspots & High Priority Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campus Hotspots (1 Col) */}
        <Card>
          <CardHeader
            title="Campus Hotspots"
            subtitle="Areas with highest complaint density"
          />
          <CardContent className="space-y-3">
            {analytics.complaintHotspots.map((h, i) => (
              <div
                key={h.location}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{h.location}</span>
                </div>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[11px] shrink-0">
                  {h.count} tickets
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Institutional Complaints (2 Cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Institutional Submissions"
              subtitle="Latest tickets across all departments"
              action={
                <Link to="/admin/complaints" className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1">
                  Manage All Tickets <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-4">Ticket</th>
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
                        <td className="py-3 px-4 font-mono font-bold text-purple-600">
                          {c.id}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {c.studentName} ({c.studentRollNo})
                          </p>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{c.departmentName}</td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={c.priority} size="sm" />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link to={`/admin/complaints/${c.id}`}>
                            <Button variant="outline" size="sm">
                              Inspect →
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
