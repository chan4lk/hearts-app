'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import StatusBadge from '@/app/components/goals/StatusBadge';
import HeartButton from '@/app/components/hearts/HeartButton';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GoalDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  targetDate: string | null;
  ownerId: string;
  assignerId: string | null;
  owner: { id: string; name: string; email: string; department: string | null; managerId: string | null };
  assigner: { id: string; name: string } | null;
  comments: Comment[];
}

interface Comment {
  id: string;
  authorId: string;
  content: string;
  type: string;
  createdAt: string;
}

const COMMENT_TYPE_STYLES: Record<string, string> = {
  APPROVAL: 'border-l-4 border-success bg-success-muted/30',
  REVISION_REQUEST: 'border-l-4 border-warning bg-warning-muted/30',
  DISCUSSION_REQUEST: 'border-l-4 border-info bg-info-muted/30',
  COMMENT: '',
};

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const { data: session } = useSession();
  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoal = async () => {
    const res = await fetch(`/api/goals/${goalId}`);
    if (res.ok) setGoal(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchGoal(); }, [goalId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/goals/${goalId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      setNewComment('');
      await fetchGoal();
    }
    setSubmitting(false);
  };

  const handleApprove = async () => {
    await fetch(`/api/goals/${goalId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await fetchGoal();
  };

  const handleRevise = async () => {
    const comment = prompt('What needs to change? (required)');
    if (!comment) return;
    await fetch(`/api/goals/${goalId}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment }) });
    await fetchGoal();
  };

  const handleStatusChange = async (status: string) => {
    await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await fetchGoal();
  };

  if (loading) return <DashboardLayout type="employee"><div className="text-center py-12 text-secondary">Loading...</div></DashboardLayout>;
  if (!goal) return <DashboardLayout type="employee"><div className="text-center py-12 text-error">Goal not found</div></DashboardLayout>;

  const isOwner = goal.ownerId === session?.user?.id;
  const isManager = session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN';

  return (
    <DashboardLayout type="employee">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/goals" className="text-secondary hover:text-primary focus-ring rounded p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <PageHeader title={goal.title}>
            <StatusBadge status={goal.status} />
          </PageHeader>
        </div>

        {/* Goal details card */}
        <div className="bg-surface-elevated rounded-xl border border-theme p-5 shadow-theme-sm space-y-4">
          {goal.description && <p className="text-sm text-secondary">{goal.description}</p>}

          <div className="flex flex-wrap gap-4 text-xs text-tertiary">
            <span>Owner: <strong className="text-primary">{goal.owner.name}</strong></span>
            {goal.assigner && <span>Assigned by: <strong className="text-primary">{goal.assigner.name}</strong></span>}
            {goal.targetDate && <span>Due: <strong className="text-primary">{new Date(goal.targetDate).toLocaleDateString()}</strong></span>}
          </div>

          {/* Progress */}
          {goal.status === 'ACTIVE' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-secondary">Progress</span>
                <span className="text-sm font-bold text-primary">{goal.progress}%</span>
              </div>
              <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {goal.status === 'DRAFT' && isOwner && (
              <button onClick={() => handleStatusChange('PENDING')} className="px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring">Submit for Approval</button>
            )}
            {goal.status === 'NEEDS_REVISION' && isOwner && (
              <button onClick={() => handleStatusChange('PENDING')} className="px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring">Resubmit</button>
            )}
            {goal.status === 'PENDING' && isManager && (
              <>
                <button onClick={handleApprove} className="px-4 py-2 bg-success text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring">Approve</button>
                <button onClick={handleRevise} className="px-4 py-2 bg-warning text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring">Needs Revision</button>
              </>
            )}
            {goal.status === 'ACTIVE' && isOwner && (
              <button onClick={() => handleStatusChange('COMPLETED')} className="px-4 py-2 bg-success text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring">Mark Complete</button>
            )}
            {goal.status !== 'CLOSED' && goal.status !== 'COMPLETED' && (
              <button onClick={() => handleStatusChange('CLOSED')} className="px-3 py-2 text-sm text-tertiary hover:text-error focus-ring rounded-lg">Close Goal</button>
            )}
          </div>
        </div>

        {/* Comments thread */}
        <div className="bg-surface-elevated rounded-xl border border-theme shadow-theme-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-theme flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-primary">Discussion ({goal.comments.length})</h3>
          </div>

          <div className="divide-y divide-[rgb(var(--color-border-theme))]">
            {goal.comments.length === 0 ? (
              <p className="text-center text-xs text-tertiary py-8">No comments yet. Start the conversation.</p>
            ) : (
              goal.comments.map((comment) => (
                <div key={comment.id} className={`px-5 py-3 ${COMMENT_TYPE_STYLES[comment.type] || ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-primary">{comment.authorId === session?.user?.id ? 'You' : 'Manager'}</span>
                    {comment.type !== 'COMMENT' && (
                      <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${
                        comment.type === 'APPROVAL' ? 'bg-success-muted text-success' :
                        comment.type === 'REVISION_REQUEST' ? 'bg-warning-muted text-warning' :
                        'bg-info-muted text-info'
                      }`}>{comment.type.replace('_', ' ')}</span>
                    )}
                    <span className="text-2xs text-tertiary">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-secondary">{comment.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Add comment */}
          <form onSubmit={handleComment} className="px-5 py-3 border-t border-theme flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={1000}
              className="flex-1 px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary placeholder:text-tertiary focus-ring"
            />
            <button type="submit" disabled={submitting || !newComment.trim()}
              className="p-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg focus-ring disabled:opacity-50" aria-label="Send comment">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}
