import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Complaint } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint;
  onSubmit: (rating: number, comments: string) => Promise<void>;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onSubmit,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(rating, comments);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolution Feedback & Acceptance"
      subtitle={`Ticket: ${complaint.id} • ${complaint.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {complaint.resolutionDetails && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <p className="font-semibold mb-0.5">Recorded Action Taken by Department:</p>
            <p className="text-emerald-800">{complaint.resolutionDetails.actionTaken}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
            How satisfied are you with the resolution?
          </label>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer"
              >
                <Star
                  className={`w-7 h-7 ${
                    (hoverRating || rating) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-xs font-medium text-slate-600 mt-2">
            {rating === 5 && 'Outstanding - Issue completely resolved'}
            {rating === 4 && 'Good - Satisfactory resolution'}
            {rating === 3 && 'Average - Resolved with delays'}
            {rating === 2 && 'Poor - Partial or sub-optimal fix'}
            {rating === 1 && 'Very Poor - Unsatisfied'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Additional Comments / Suggestions
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Help college authorities improve facility response times..."
            rows={3}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Accept & Close Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};
