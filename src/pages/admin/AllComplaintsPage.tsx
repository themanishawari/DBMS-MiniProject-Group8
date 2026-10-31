import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  Download,
  Filter,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { AssignHandlerModal } from '../../components/complaint/AssignHandlerModal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ComplaintService } from '../../services/ComplaintService';
import { ExportService } from '../../services/ExportService';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  Department,
} from '../../types';

export const AllComplaintsPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');
  const [isOverdueOnly, setIsOverdueOnly] = useState(false);
  const [isSensitiveOnly, setIsSensitiveOnly] = useState(false);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  // Action Modals
  const [assignModalComplaint, setAssignModalComplaint] = useState<Complaint | null>(null);
  const [archiveModalComplaint, setArchiveModalComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const [data, cats, depts] = await Promise.all([
        complaintRepository.getComplaints(
          {
            searchQuery: searchQuery || undefined,
            status: statusFilter,
            departmentId: departmentFilter,
            categoryId: categoryFilter,
            priority: priorityFilter,
            isOverdue: isOverdueOnly ? true : undefined,
            isSensitive: isSensitiveOnly ? true : undefined,
            page: currentPage,
            pageSize,
          },
          currentUser
        ),
        complaintRepository.getCategories(),
        complaintRepository.getDepartments(),
      ]);
      setComplaints(data.complaints);
      setTotalCount(data.total);
      setCategories(cats);
      setDepartments(depts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [
    currentUser,
    searchQuery,
    statusFilter,
    departmentFilter,
    categoryFilter,
    priorityFilter,
    isOverdueOnly,
    isSensitiveOnly,
    currentPage,
  ]);

  const handleAssignSubmit = async (
    departmentId: string,
    departmentName: string,
    staffId?: string,
    staffName?: string,
    remarks?: string
  ) => {
    if (!assignModalComplaint) return;
    await ComplaintService.assignComplaint(
      assignModalComplaint.id,
      departmentId,
      departmentName,
      staffId,
      staffName,
      remarks,
      currentUser
    );
    await fetchComplaints();
  };

  const handleArchiveConfirm = async () => {
    if (!archiveModalComplaint) return;
    await complaintRepository.archiveComplaint(archiveModalComplaint.id, currentUser);
    setArchiveModalComplaint(null);
    await fetchComplaints();
  };

  const handleExportCSV = () => {
    try {
      ExportService.exportComplaintsToCSV(
        complaints,
        currentUser,
        `admin-all-complaints-${new Date().toISOString().split('T')[0]}.csv`
      );
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All College Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global institution ledger with assignment controls, department routing, and audit records
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          icon={<Download className="w-3.5 h-3.5" />}
        >
          Export Filtered CSV
        </Button>
      </div>

      {/* Comprehensive Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search ticket ID, title, student, roll number, building..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_student_response">Awaiting Info</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="reopened">Reopened</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={isOverdueOnly}
                  onChange={(e) => {
                    setIsOverdueOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-rose-700 font-semibold">Overdue Only</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={isSensitiveOnly}
                  onChange={(e) => {
                    setIsSensitiveOnly(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-purple-700 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Confidential Grievances Only
                </span>
              </label>
            </div>

            <span className="text-slate-500">
              Showing <strong>{complaints.length}</strong> of <strong>{totalCount}</strong> matching complaints
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Global Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No Matching Complaints Found"
              description="No tickets found matching your query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Subject & Student</th>
                    <th className="py-3 px-4">Department & Handler</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">SLA Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/admin/complaints/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-purple-600 truncate block"
                        >
                          {c.title}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.studentName} ({c.studentRollNo}) • {c.location.campusArea}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{c.departmentName}</p>
                        <p className="text-[11px] text-slate-400">
                          {c.assignedStaffName || <span className="italic">Queue Unassigned</span>}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.categoryName}</td>
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
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAssignModalComplaint(c)}
                          title="Reassign Department or Handler"
                        >
                          Assign
                        </Button>
                        <Link to={`/admin/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                        <button
                          onClick={() => setArchiveModalComplaint(c)}
                          title="Archive Complaint"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
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

      {/* Assignment Modal */}
      {assignModalComplaint && (
        <AssignHandlerModal
          isOpen={!!assignModalComplaint}
          onClose={() => setAssignModalComplaint(null)}
          complaint={assignModalComplaint}
          onAssign={handleAssignSubmit}
        />
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!archiveModalComplaint}
        onClose={() => setArchiveModalComplaint(null)}
        onConfirm={handleArchiveConfirm}
        title="Archive Complaint Record?"
        description={`Are you sure you want to archive ticket ${archiveModalComplaint?.id}? It will be removed from active student and staff dashboards but preserved in the institutional audit trail.`}
        confirmLabel="Archive Complaint"
        isDestructive={true}
      />
    </div>
  );
};
