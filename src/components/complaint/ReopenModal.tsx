import React, { useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Complaint } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface ReopenModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint;
  onReopen: (reason: string) => Promise<void>;
}

export const ReopenModal: React.FC<ReopenModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onReopen,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim() || reason.trim().length < 10) {
      setError('Please provide specific details on why the issue persists (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReopen(reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reopen complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reopen Complaint Ticket"
      subtitle={`Ticket: ${complaint.id} • ${complaint.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-orange-900">
          <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <p>
            Reopening this complaint marks it as <strong>Reopened (Active Priority)</strong> and notifies
            the department supervisor for immediate inspection.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Why does the problem persist? <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe what is still not working or broke down again..."
            rows={4}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSubmitting}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reopen Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};
