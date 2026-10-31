import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Clock, Download, FileCheck2, TrendingUp } from 'lucide-react';
import { CategoryBreakdownChart } from '../../components/analytics/CategoryBreakdownChart';
import { StatusDistributionChart } from '../../components/analytics/StatusDistributionChart';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { AnalyticsService, CCMSAnalyticsSummary } from '../../services/AnalyticsService';

export const DepartmentReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState<CCMSAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await AnalyticsService.getAnalytics(currentUser);
        setAnalytics(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [currentUser]);

  if (isLoading || !analytics) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading department metrics...</div>;
  }

  const deptPerf = analytics.departmentPerformance.find(
    (d) => d.departmentName === currentUser.departmentName
  ) || {
    departmentName: currentUser.departmentName || 'Department',
    total: analytics.totalComplaints,
    resolved: analytics.resolvedComplaints,
    pending: analytics.activeComplaints,
    resolutionRate:
      analytics.totalComplaints > 0
        ? Math.round((analytics.resolvedComplaints / analytics.totalComplaints) * 100)
        : 85,
    avgResolutionHours: analytics.averageResolutionTimeHours,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Operational Performance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser.departmentName || 'Department'} Performance Report
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Resolution rate, average turnaround duration, and category breakdown
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Print Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Resolution Rate"
          value={`${deptPerf.resolutionRate}%`}
          subtitle="Resolved vs received tickets"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Avg Turnaround"
          value={`${deptPerf.avgResolutionHours} hrs`}
          subtitle="Mean time to resolution"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Total Handled"
          value={deptPerf.total}
          subtitle="Assigned department volume"
          icon={<FileCheck2 className="w-5 h-5" />}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-700"
        />
        <StatCard
          label="Student Rating"
          value={`${analytics.satisfactionRatingAvg} / 5.0`}
          subtitle="Based on student feedback"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Ticket Category Volume"
            subtitle="Breakdown of grievances by sub-discipline"
          />
          <CardContent>
            <CategoryBreakdownChart data={analytics.categoryDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Status Distribution"
            subtitle="Current disposition of department tickets"
          />
          <CardContent>
            <StatusDistributionChart data={analytics.statusDistribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
