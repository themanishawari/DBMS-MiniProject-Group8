import React, { useState } from 'react';
import { ALLOWED_TRANSITIONS, STATUS_CONFIG } from '../../data/constants';
import { Complaint, ComplaintStatus, User } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint;
  currentUser: User;
  onSubmit: (newStatus: ComplaintStatus, remarks: string, resolutionAction?: string) => Promise<void>;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  complaint,
  currentUser,
  onSubmit,
}) => {
  const transitionRules = ALLOWED_TRANSITIONS[complaint.status];
  const eligibleStatuses = transitionRules?.nextStatuses || [];
  const isAllowedRole = transitionRules?.allowedRoles.includes(currentUser.role) || currentUser.role === 'admin';

  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(
    eligibleStatuses[0] || 'in_progress'
  );
  const [remarks, setRemarks] = useState('');
  const [resolutionAction, setResolutionAction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!remarks.trim() || remarks.trim().length < 5) {
      setError('Please provide change remarks (at least 5 characters).');
      return;
    }

    if (selectedStatus === 'resolved' && (!resolutionAction.trim() || resolutionAction.trim().length < 10)) {
      setError('Please provide detailed action taken to resolve this issue (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedStatus, remarks, resolutionAction);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Complaint Status"
      subtitle={`Ticket: ${complaint.id} • Current: ${STATUS_CONFIG[complaint.status]?.label}`}
    >
      {!isAllowedRole ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
          Your role ({currentUser.role}) does not have permission to transition this complaint from{' '}
          <strong>{STATUS_CONFIG[complaint.status]?.label}</strong>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Next Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ComplaintStatus)}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              {eligibleStatuses.map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st]?.label} — {STATUS_CONFIG[st]?.description}
                </option>
              ))}
            </select>
          </div>

          {selectedStatus === 'resolved' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Action Taken for Resolution <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={resolutionAction}
                onChange={(e) => setResolutionAction(e.target.value)}
                placeholder="E.g., Replaced blown fuse, re-soldered lab switch, re-calibrated sensors..."
                rows={3}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This will be shared with the student for verification and acceptance.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Activity History Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="State reason or progress update for the audit log..."
              rows={3}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Confirm Transition
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
