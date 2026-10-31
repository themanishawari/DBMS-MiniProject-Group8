import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Complaint } from '../../types';

interface SLAIndicatorProps {
  complaint: Complaint;
}

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({ complaint }) => {
  const isCompleted = complaint.status === 'resolved' || complaint.status === 'closed';

  if (isCompleted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-emerald-900">SLA Met & Resolved</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Resolved on{' '}
            {complaint.resolutionDetails?.resolvedAt
              ? new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()
              : new Date(complaint.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  const now = new Date().getTime();
  const deadline = new Date(complaint.slaDeadline).getTime();
  const created = new Date(complaint.createdAt).getTime();

  const totalDuration = Math.max(1, deadline - created);
  const elapsed = Math.max(0, now - created);
  const remainingHours = Math.round((deadline - now) / (1000 * 60 * 60));
  const isOverdue = now > deadline || complaint.isOverdue;

  const progressPercent = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  return (
    <div
      className={`rounded-xl p-3.5 border ${
        isOverdue ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-1.5 font-medium">
          {isOverdue ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <Clock className="w-4 h-4 text-slate-500" />
          )}
          <span className={isOverdue ? 'text-rose-900 font-semibold' : 'text-slate-700'}>
            {isOverdue ? `Overdue by ${Math.abs(remainingHours)} hours` : `${remainingHours}h remaining for SLA`}
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          Deadline: {new Date(complaint.slaDeadline).toLocaleDateString()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all rounded-full ${
            isOverdue ? 'bg-rose-500' : progressPercent > 75 ? 'bg-amber-500' : 'bg-indigo-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
        <span>Logged: {new Date(complaint.createdAt).toLocaleDateString()}</span>
        <span>Target: {complaint.priority.toUpperCase()} SLA</span>
      </div>
    </div>
  );
};
