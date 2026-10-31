import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ExportService } from '../../services/ExportService';
import { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../../types';

export const MyComplaintsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>(
    (searchParams.get('status') as ComplaintStatus) || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get('category') || 'all'
  );
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [totalCount, setTotalCount] = useState(0);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const [data, cats] = await Promise.all([
        complaintRepository.getComplaints(
          {
            searchQuery: searchQuery || undefined,
            status: statusFilter,
            categoryId: categoryFilter,
            priority: priorityFilter,
            sortBy,
            sortOrder,
            page: currentPage,
            pageSize,
          },
          currentUser
        ),
        complaintRepository.getCategories(),
      ]);
      setComplaints(data.complaints);
      setTotalCount(data.total);
      setCategories(cats);
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
    categoryFilter,
    priorityFilter,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  const handleExportCSV = () => {
    try {
      ExportService.exportComplaintsToCSV(
        complaints,
        currentUser,
        `student-complaints-${currentUser.name.replace(/\s+/g, '_')}.csv`
      );
    } catch (err: any) {
      alert(err.message || 'Export failed.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track real-time status, department assignment, and investigation history for your tickets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Link to="/student/submit">
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
              Submit New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search complaints by ID, title, keyword, or room..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-44">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
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

            {/* Category Filter */}
            <div className="w-full md:w-52">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="w-full md:w-36">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Showing <strong>{complaints.length}</strong> of <strong>{totalCount}</strong> recorded tickets
            </span>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Sort by:</span>
              <button
                type="button"
                onClick={() => setSortBy(sortBy === 'createdAt' ? 'updatedAt' : 'createdAt')}
                className="font-medium text-slate-700 hover:text-indigo-600 underline"
              >
                {sortBy === 'createdAt' ? 'Date Logged' : 'Last Updated'}
              </button>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-[10px] uppercase font-bold bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
              >
                {sortOrder}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No Matching Complaints Found"
              description="No complaints match your current search or filter criteria. Try clearing filters or submit a new grievance."
              actionLabel="Submit Complaint"
              onAction={() => (window.location.href = '/student/submit')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Subject & Location</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {c.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <Link
                          to={`/student/complaints/${c.id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 truncate block"
                        >
                          {c.title}
                        </Link>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {c.location.campusArea}
                          {c.location.roomNumber ? ` (${c.location.roomNumber})` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.categoryName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.departmentName}</td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={c.priority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link to={`/student/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">
                            View
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

      {/* Pagination Controls */}
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
