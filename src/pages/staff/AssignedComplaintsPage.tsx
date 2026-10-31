import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Filter, Search } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ExportService } from '../../services/ExportService';
import { Complaint, ComplaintPriority, ComplaintStatus } from '../../types';

export const AssignedComplaintsPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await complaintRepository.getComplaints(
        {
          searchQuery: searchQuery || undefined,
          status: statusFilter,
          priority: priorityFilter,
          isOverdue: isOverdueOnly ? true : undefined,
          page: currentPage,
          pageSize,
        },
        currentUser
      );
      setComplaints(data.complaints);
      setTotalCount(data.total);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [currentUser, searchQuery, statusFilter, priorityFilter, isOverdueOnly, currentPage]);

  const handleExportCSV = () => {
    try {
      ExportService.exportComplaintsToCSV(
        complaints,
        currentUser,
        `dept-complaints-${currentUser.departmentName || 'department'}.csv`
      );
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Department Queue & Assigned Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complaints routed to {currentUser.departmentName || 'your department'} for investigation and resolution
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export Department CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ticket ID, title, student roll number, or lab..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="w-full md:w-44">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted (New)</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_student_response">Awaiting Info</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
              </select>
            </div>

            <div className="w-full md:w-36">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOverdueOnly}
                  onChange={(e) => {
                    setIsOverdueOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-rose-700">Overdue Only</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No Matching Complaints Found"
              description="No tickets match your filter parameters in this department queue."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Subject & Subcategory</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Assigned Handler</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SLA Deadline</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/staff/complaints/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 truncate block"
                        >
                          {c.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate">
                          {c.subcategoryName} • {c.location.campusArea}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{c.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.studentRollNo}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.assignedStaffName || <span className="italic text-slate-400">Queue</span>}
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
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/staff/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">
                            Manage →
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
