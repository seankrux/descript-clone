import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Check, 
  Send, 
  Clock, 
  Users, 
  CornerDownRight, 
  CheckCircle2, 
  Circle 
} from 'lucide-react';
import { CommentItem } from '../types';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CommentItem[];
  currentTime: number;
  onAddComment: (comment: CommentItem) => void;
  onToggleResolve: (id: string) => void;
  onSeek: (time: number) => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  isOpen,
  onClose,
  comments,
  currentTime,
  onAddComment,
  onToggleResolve,
  onSeek,
}) => {
  const [newText, setNewText] = useState('');
  const [filter, setFilter] = useState<'all' | 'unresolved'>('all');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      author: 'Alex Rivera (You)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
      timecode: Number(currentTime.toFixed(1)),
      createdAt: 'Just now',
      text: newText.trim(),
      resolved: false,
    };

    onAddComment(newComment);
    setNewText('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const filteredComments = comments.filter((c) =>
    filter === 'all' ? true : !c.resolved
  );

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] max-w-full bg-[#121622] border-l border-white/[0.1] shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200 pt-safe pb-safe">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Collaboration & Feedback</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {comments.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Timestamped review and feedback threads</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Collaborator Presence Pill */}
      <div className="p-3 border-b border-white/[0.06] bg-[#0e1118]/60 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt="Alex"
              className="w-6 h-6 rounded-full border-2 border-[#121622]"
            />
            <img
              src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&q=80"
              alt="Sarah"
              className="w-6 h-6 rounded-full border-2 border-[#121622]"
            />
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
              alt="Elena"
              className="w-6 h-6 rounded-full border-2 border-[#121622]"
            />
          </div>
          <span className="text-[11px] text-slate-400">3 editors active</span>
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded ${filter === 'all' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-2 py-0.5 rounded ${filter === 'unresolved' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Open
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            No comments yet. Type a comment below to drop a timecode marker at {formatTime(currentTime)}.
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3.5 rounded-xl border transition-colors ${
                comment.resolved
                  ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
                  : 'bg-white/[0.03] border-white/[0.07] hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-semibold text-white">{comment.author}</span>
                  <span className="text-[10px] text-slate-500">{comment.createdAt}</span>
                </div>

                <button
                  onClick={() => onToggleResolve(comment.id)}
                  className={`p-1 rounded transition-colors ${
                    comment.resolved
                      ? 'text-emerald-400 hover:text-slate-400'
                      : 'text-slate-500 hover:text-emerald-400'
                  }`}
                  title={comment.resolved ? 'Unresolve comment' : 'Resolve comment'}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>

              {/* Timecode badge */}
              <button
                onClick={() => onSeek(comment.timecode)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] hover:bg-indigo-500/30 transition-colors mb-2 cursor-pointer"
              >
                <Clock className="w-2.5 h-2.5" />
                <span>{formatTime(comment.timecode)}</span>
              </button>

              <p className="text-xs text-slate-200 leading-relaxed">{comment.text}</p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-2">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 text-xs">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-indigo-300 text-[11px]">{reply.author}</span>
                          <span className="text-[9px] text-slate-500">{reply.createdAt}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5">{reply.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.08] bg-[#161b2a]">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span>Commenting at current frame ({formatTime(currentTime)})</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add timestamped feedback or mention @Sarah..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={!newText.trim()}
            className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
