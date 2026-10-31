import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  RotateCcw,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { STATUS_CONFIG } from '../../data/constants';
import { StatusHistoryEntry } from '../../types';

interface ComplaintTimelineProps {
  history: StatusHistoryEntry[];
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ history }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'acknowledged':
        return <Clock className="w-4 h-4 text-sky-600" />;
      case 'assigned':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'reopened':
        return <RotateCcw className="w-4 h-4 text-orange-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-500 py-3">No activity recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((entry, index) => {
        const isLatest = index === history.length - 1;
        const config = STATUS_CONFIG[entry.toStatus] || STATUS_CONFIG.submitted;

        return (
          <div key={entry.id || index} className="relative group">
            {/* Timeline bullet icon */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center ${
                isLatest ? 'border-indigo-600 shadow-xs' : 'border-slate-300'
              }`}
            >
              {getStatusIcon(entry.toStatus)}
            </div>

            {/* Entry Content */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${config.text}`}>
                    {config.label}
                  </span>
                  <span className="text-[11px] text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-700">
                    {entry.changedByName}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200/70 px-1.5 py-0.2 rounded">
                    {entry.changedByRole}
                  </span>
                </div>
                <time className="text-[11px] text-slate-400">
                  {new Date(entry.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                {entry.remarks}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
