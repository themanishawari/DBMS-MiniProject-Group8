import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Paperclip,
  RotateCcw,
  Shield,
  Star,
  UserCheck,
} from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader } from '../../components/common/Card';
import { CommentSection } from '../../components/complaint/CommentSection';
import { ComplaintTimeline } from '../../components/complaint/ComplaintTimeline';
import { FeedbackModal } from '../../components/complaint/FeedbackModal';
import { ReopenModal } from '../../components/complaint/ReopenModal';
import { SLAIndicator } from '../../components/complaint/SLAIndicator';
import { useAuth } from '../../context/AuthContext';
import { ComplaintService } from '../../services/ComplaintService';
import { Comment, Complaint, StatusHistoryEntry } from '../../types';

export const StudentComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);

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
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, currentUser]);

  const handleAddComment = async (content: string, isInternal: boolean) => {
    if (!complaint) return;
    await ComplaintService.addComment(complaint.id, content, isInternal, currentUser);
    await fetchDetails();
  };

  const handleFeedbackSubmit = async (rating: number, commentText: string) => {
    if (!complaint) return;
    await ComplaintService.submitFeedback(complaint.id, rating, commentText, currentUser);
    await fetchDetails();
  };

  const handleReopenSubmit = async (reason: string) => {
    if (!complaint) return;
    await ComplaintService.transitionStatus(complaint.id, 'reopened', `REOPENED BY STUDENT: ${reason}`, currentUser);
    await fetchDetails();
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
        <h2 className="text-xl font-bold text-slate-900">Access Restricted or Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This ticket does not exist.'}</p>
        <Link to="/student/complaints">
          <Button variant="outline" size="sm">
            ← Return to My Complaints
          </Button>
        </Link>
      </div>
    );
  }

  const isResolved = complaint.status === 'resolved';
  const isClosed = complaint.status === 'closed';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/student/complaints"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Complaints
        </Link>

        {/* Resolution Acceptance & Reopen Action Buttons */}
        {isResolved && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReopenOpen(true)}
              className="text-orange-700 border-orange-300 hover:bg-orange-50"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reopen Ticket
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Accept Resolution & Rate
            </Button>
          </div>
        )}
      </div>

      {/* Ticket Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {complaint.id}
                </span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                {complaint.isSensitive && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Confidential
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

          {/* Feedback Rating Banner if already closed with feedback */}
          {complaint.feedback && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-950">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-semibold">Student Resolution Rating:</span>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= complaint.feedback!.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold">({complaint.feedback.rating}/5)</span>
                </div>
                <p className="italic text-emerald-800">"{complaint.feedback.comments || 'No remarks added.'}"</p>
              </div>
              <span className="text-[10px] text-emerald-600 shrink-0">Accepted by Student</span>
            </div>
          )}

          {/* Reopen Warning Banner if currently reopened */}
          {complaint.status === 'reopened' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 flex items-start gap-2">
              <RotateCcw className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Complaint Reopened (Reopen Count: {complaint.reopenCount})</p>
                <p className="text-[11px] text-orange-800 mt-0.5">
                  Reason provided: "{complaint.reopenReason}"
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2-Column Layout: Left (Description, Attachments, Comments) / Right (Details & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Problem Description */}
          <Card>
            <CardHeader title="Problem Description" />
            <CardContent>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </CardContent>
          </Card>

          {/* Action Taken (If Resolved) */}
          {complaint.resolutionDetails && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader title="Official Resolution Action Taken" />
              <CardContent className="space-y-2 text-xs">
                <div>
                  <p className="font-semibold text-slate-800">Action Performed by Department:</p>
                  <p className="text-slate-700 mt-0.5 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                    {complaint.resolutionDetails.actionTaken}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                  <span>Resolved by: <strong>{complaint.resolutionDetails.resolvedByName}</strong></span>
                  <span>
                    Timestamp: {new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()}
                  </span>
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
                        <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{att.fileName}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(att.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <a
                        href={att.url}
                        download={att.fileName}
                        className="text-indigo-600 hover:text-indigo-800 p-1 flex items-center gap-1 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments & Dialogue */}
          <Card>
            <CardHeader
              title="Ticket Communication & Inquiries"
              subtitle="Direct messages exchanged with the assigned department"
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

        {/* Right Column (1 Col): Location, Metadata & Visual Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader title="Complaint Metadata" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">{complaint.location.campusArea}</p>
                  <p className="text-slate-500 text-[11px]">
                    {complaint.location.building} • {complaint.location.floor} • Room {complaint.location.roomNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px]">Assigned Handler</p>
                  <p className="font-medium text-slate-900">
                    {complaint.assignedStaffName || 'Department General Queue'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px]">Date Submitted</p>
                  <p className="font-medium text-slate-900">
                    {new Date(complaint.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-slate-500 text-[10px]">Preferred Update Channel</p>
                  <p className="font-medium text-slate-900 capitalize">
                    {complaint.preferredContact}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader
              title="Official Activity Timeline"
              subtitle="Audited progression of status changes"
            />
            <CardContent>
              <ComplaintTimeline history={history} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        complaint={complaint}
        onSubmit={handleFeedbackSubmit}
      />

      <ReopenModal
        isOpen={isReopenOpen}
        onClose={() => setIsReopenOpen(false)}
        complaint={complaint}
        onReopen={handleReopenSubmit}
      />
    </div>
  );
};
