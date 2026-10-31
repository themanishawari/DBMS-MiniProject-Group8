import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flag,
  Lock,
  Mail,
  MapPin,
  Paperclip,
  Shield,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AssignHandlerModal } from '../../components/complaint/AssignHandlerModal';
import { CommentSection } from '../../components/complaint/CommentSection';
import { ComplaintTimeline } from '../../components/complaint/ComplaintTimeline';
import { SLAIndicator } from '../../components/complaint/SLAIndicator';
import { StatusChangeModal } from '../../components/complaint/StatusChangeModal';
import { useAuth } from '../../context/AuthContext';
import { complaintRepository } from '../../repositories';
import { ComplaintService } from '../../services/ComplaintService';
import { Comment, Complaint, ComplaintPriority, ComplaintStatus, StatusHistoryEntry } from '../../types';

export const AdminComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await ComplaintService.getComplaintDetails(id, currentUser);
      if (data) {
        setComplaint(data.complaint);
        setHistory(data.history);
        setComments(data.comments);
      } else {
        setError('Complaint not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, currentUser]);

  const handleStatusUpdate = async (newStatus: ComplaintStatus, remarks: string, resolutionAction?: string) => {
    if (!complaint) return;
    await ComplaintService.transitionStatus(complaint.id, newStatus, remarks, currentUser, resolutionAction);
    await fetchDetails();
  };

  const handleAssignSubmit = async (
    deptId: string,
    deptName: string,
    staffId?: string,
    staffName?: string,
    remarks?: string
  ) => {
    if (!complaint) return;
    await ComplaintService.assignComplaint(
      complaint.id,
      deptId,
      deptName,
      staffId,
      staffName,
      remarks,
      currentUser
    );
    await fetchDetails();
  };

  const handleChangePriority = async () => {
    if (!complaint) return;
    const newP = prompt('Enter new priority (low, medium, high, critical):', complaint.priority);
    if (!newP || !['low', 'medium', 'high', 'critical'].includes(newP.toLowerCase())) return;

    const just = prompt('Enter administrative justification for priority change:');
    if (!just) return;

    await ComplaintService.changePriority(complaint.id, newP.toLowerCase() as ComplaintPriority, just, currentUser);
    await fetchDetails();
  };

  const handleArchive = async () => {
    if (!complaint) return;
    await complaintRepository.archiveComplaint(complaint.id, currentUser);
    navigate('/admin/complaints');
  };

  const handleAddComment = async (content: string, isInternal: boolean) => {
    if (!complaint) return;
    await ComplaintService.addComment(complaint.id, content, isInternal, currentUser);
    await fetchDetails();
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading master ticket details...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">{error}</p>
        <Link to="/admin/complaints">
          <Button variant="outline" size="sm">
            ← Back to All Complaints
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/admin/complaints"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Master Ledger
        </Link>

        {/* Admin Master Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleChangePriority}
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Adjust Priority
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsAssignModalOpen(true)}
            icon={<UserCheck className="w-3.5 h-3.5" />}
          >
            Reassign Handler / Dept
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Update Workflow Status
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsArchiveConfirmOpen(true)}
            className="text-rose-600 hover:bg-rose-50"
            icon={<Archive className="w-3.5 h-3.5" />}
          >
            Archive
          </Button>
        </div>
      </div>

      {/* Header Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  {complaint.id}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.isSensitive && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Confidential
                  </span>
                )}
                {complaint.isOverdue && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold text-slate-900 mt-1">{complaint.title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                <span>Category: <strong>{complaint.categoryName}</strong></span>
                <span>•</span>
                <span>Department: <strong>{complaint.departmentName}</strong></span>
                <span>•</span>
                <span>Student: <strong>{complaint.studentName} ({complaint.studentRollNo})</strong></span>
              </div>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SLAIndicator complaint={complaint} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Complaint Description" />
            <CardContent>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </CardContent>
          </Card>

          {complaint.resolutionDetails && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader title="Resolution Record" />
              <CardContent className="space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Action Performed:</p>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {complaint.resolutionDetails.actionTaken}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                  <span>Resolved by: {complaint.resolutionDetails.resolvedByName}</span>
                  <span>{new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader title={`Supporting Attachments (${complaint.attachments.length})`} />
            <CardContent>
              {complaint.attachments.length === 0 ? (
                <p className="text-xs text-slate-400">No media attachments uploaded with this ticket.</p>
              ) : (
                <div className="space-y-2">
                  {complaint.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Paperclip className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                      </div>
                      <a
                        href={att.url}
                        download={att.fileName}
                        className="text-purple-600 hover:text-purple-800 p-1 flex items-center gap-1 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialogue & Internal Notes */}
          <Card>
            <CardHeader title="Communications & Internal Audit Notes" />
            <CardContent>
              <CommentSection
                comments={comments}
                currentUser={currentUser}
                onAddComment={handleAddComment}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Student Info, Routing & Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Student & Location" />
            <CardContent className="space-y-3 text-xs">
              <div>
                <p className="font-semibold text-slate-900">{complaint.studentName}</p>
                <p className="text-slate-500 font-mono text-[11px]">Roll: {complaint.studentRollNo}</p>
                <p className="text-slate-500 text-[11px]">{complaint.studentEmail}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">{complaint.location.campusArea}</p>
                  <p className="text-slate-500 text-[11px]">
                    {complaint.location.building} • {complaint.location.floor} • Room {complaint.location.roomNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">Assigned Staff</p>
                <p className="font-semibold text-slate-800">
                  {complaint.assignedStaffName || 'Department Queue'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Activity Timeline" />
            <CardContent>
              <ComplaintTimeline history={history} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {isStatusModalOpen && (
        <StatusChangeModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          complaint={complaint}
          currentUser={currentUser}
          onSubmit={handleStatusUpdate}
        />
      )}

      {isAssignModalOpen && (
        <AssignHandlerModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          complaint={complaint}
          onAssign={handleAssignSubmit}
        />
      )}

      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchive}
        title="Archive Complaint?"
        description="Archiving will remove this complaint from active departmental dashboards while preserving full history in the institutional audit log."
        confirmLabel="Archive Record"
        isDestructive={true}
      />
    </div>
  );
};
