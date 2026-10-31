import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
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
  Phone,
  Shield,
  UserCheck,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { CommentSection } from '../../components/complaint/CommentSection';
import { ComplaintTimeline } from '../../components/complaint/ComplaintTimeline';
import { EscalationModal } from '../../components/complaint/EscalationModal';
import { SLAIndicator } from '../../components/complaint/SLAIndicator';
import { StatusChangeModal } from '../../components/complaint/StatusChangeModal';
import { useAuth } from '../../context/AuthContext';
import { ComplaintService } from '../../services/ComplaintService';
import { Comment, Complaint, ComplaintStatus, StatusHistoryEntry } from '../../types';

export const StaffComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

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
        setError('Complaint not found or unauthorized.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load complaint details.');
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

  const handleEscalateSubmit = async (reason: string) => {
    if (!complaint) return;
    await ComplaintService.escalateComplaint(complaint.id, reason, currentUser);
    await fetchDetails();
  };

  const handleAddComment = async (content: string, isInternal: boolean) => {
    if (!complaint) return;
    await ComplaintService.addComment(complaint.id, content, isInternal, currentUser);
    await fetchDetails();
  };

  const handleAcknowledge = async () => {
    if (!complaint) return;
    await ComplaintService.transitionStatus(
      complaint.id,
      'acknowledged',
      `Ticket acknowledged by ${currentUser.name} (${currentUser.departmentName || 'Staff'})`,
      currentUser
    );
    await fetchDetails();
  };

  const handleFlagMisclassified = async () => {
    if (!complaint) return;
    const notes = prompt('Enter notes explaining why this ticket is misclassified or duplicate:');
    if (notes) {
      await ComplaintService.addComment(
        complaint.id,
        `FLAGGED MISCLASSIFIED/DUPLICATE: ${notes}`,
        true,
        currentUser
      );
      alert('Internal flag recorded for Administrative re-routing.');
      await fetchDetails();
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-500">Loading complaint details...</div>;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">{error || 'Unable to access this ticket.'}</p>
        <Link to="/staff/assigned">
          <Button variant="outline" size="sm">
            ← Return to Department Queue
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
          to="/staff/assigned"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Department Queue
        </Link>

        {/* Action Controls for Staff */}
        <div className="flex flex-wrap items-center gap-2">
          {complaint.status === 'submitted' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAcknowledge}
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
            >
              Acknowledge Ticket
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleFlagMisclassified}
            icon={<Flag className="w-3.5 h-3.5 text-amber-600" />}
          >
            Flag Misclassified
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEscalateModalOpen(true)}
            className="text-rose-700 border-rose-300 hover:bg-rose-50"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            Escalate Issue
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsStatusModalOpen(true)}
          >
            Change Workflow Status →
          </Button>
        </div>
      </div>

      {/* Ticket Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {complaint.id}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
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
                <span>Subcategory: <strong>{complaint.subcategoryName}</strong></span>
                <span>•</span>
                <span>Department: <strong>{complaint.departmentName}</strong></span>
              </div>
            </div>

            {/* SLA Clock Card */}
            <div className="w-full sm:w-72 shrink-0">
              <SLAIndicator complaint={complaint} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Attachments, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader title="Reported Problem Description" />
            <CardContent>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </CardContent>
          </Card>

          {/* Action Taken (if recorded) */}
          {complaint.resolutionDetails && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader title="Recorded Resolution Details" />
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
                        <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(att.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <a
                        href={att.url}
                        download={att.fileName}
                        className="text-blue-600 hover:text-blue-800 p-1 flex items-center gap-1 font-semibold"
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
            <CardHeader
              title="Ticket Communications & Staff Notes"
              subtitle="Send public messages to the student or check 'Internal Staff Note' to document confidential progress"
            />
            <CardContent>
              <CommentSection
                comments={comments}
                currentUser={currentUser}
                onAddComment={handleAddComment}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Student Info, Location & Timeline */}
        <div className="space-y-6">
          {/* Student Contact Info Card */}
          <Card>
            <CardHeader title="Student Information" />
            <CardContent className="space-y-2.5 text-xs">
              <div>
                <p className="font-semibold text-slate-900">{complaint.studentName}</p>
                <p className="text-slate-500 font-mono text-[11px]">Roll: {complaint.studentRollNo}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${complaint.studentEmail}`} className="hover:text-blue-600 truncate">
                  {complaint.studentEmail}
                </a>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Preferred: <strong className="capitalize">{complaint.preferredContact}</strong></span>
              </div>
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader title="Facility Location" />
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">{complaint.location.campusArea}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Building: <strong>{complaint.location.building || 'Main'}</strong>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Floor / Room: <strong>{complaint.location.floor || 'N/A'}</strong> (Room{' '}
                    <strong>{complaint.location.roomNumber || 'N/A'}</strong>)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
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

      {isEscalateModalOpen && (
        <EscalationModal
          isOpen={isEscalateModalOpen}
          onClose={() => setIsEscalateModalOpen(false)}
          complaint={complaint}
          onEscalate={handleEscalateSubmit}
        />
      )}
    </div>
  );
};
