import React, { useState } from 'react';
import { Lock, MessageSquare, Send } from 'lucide-react';
import { Comment, User } from '../../types';
import { Button } from '../common/Button';

interface CommentSectionProps {
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string, isInternal: boolean) => Promise<void>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  currentUser,
  onAddComment,
}) => {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPostInternal = currentUser.role === 'staff' || currentUser.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      await onAddComment(content.trim(), isInternal);
      setContent('');
      setIsInternal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to post comment.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Comments */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No messages or updates on this ticket yet.
          </p>
        ) : (
          comments.map((comm) => (
            <div
              key={comm.id}
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                comm.isInternal
                  ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
                  : 'bg-white border-slate-200/80 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{comm.userName}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      comm.userRole === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : comm.userRole === 'staff'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {comm.userRole}
                  </span>
                  {comm.isInternal && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded">
                      <Lock className="w-2.5 h-2.5" /> Staff Internal Note
                    </span>
                  )}
                </div>
                <time className="text-[10px] text-slate-400">
                  {new Date(comm.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              <p className="whitespace-pre-wrap">{comm.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Add New Comment */}
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
            {error}
          </p>
        )}

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              isInternal
                ? 'Type internal investigation note (visible only to department staff & administrators)...'
                : 'Write a response or question for this complaint...'
            }
            rows={3}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {canPostInternal ? (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="flex items-center gap-1 font-medium text-amber-800">
                <Lock className="w-3.5 h-3.5" /> Post as Internal Staff Note
              </span>
            </label>
          ) : (
            <span className="text-[11px] text-slate-400">
              Comments are visible to assigned department authorities.
            </span>
          )}

          <Button
            type="submit"
            size="sm"
            variant={isInternal ? 'secondary' : 'primary'}
            isLoading={isPosting}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Post Message
          </Button>
        </div>
      </form>
    </div>
  );
};
