import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Complaint } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint;
  onEscalate: (reason: string) => Promise<void>;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onEscalate,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim() || reason.trim().length < 10) {
      setError('Please provide a specific reason for escalation (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onEscalate(reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to escalate ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escalate Complaint" subtitle={`Ticket: ${complaint.id}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p>
            Escalating this ticket flags it directly on the <strong>Dean & Administrator Dashboard</strong> and
            elevates priority handling in the institutional queue.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Escalation Reason & Bottleneck Details <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why standard department resolution is blocked (e.g. procurement delay, safety risk, repeated breakdown)..."
            rows={4}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" isLoading={isSubmitting}>
            Confirm Escalation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
