'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatusBadge from '@/app/components/goals/StatusBadge';
import HeartButton from '@/app/components/hearts/HeartButton';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import { ArrowLeft, Send, MessageSquare, Pencil, Trash2, AlertTriangle, Pause, Ban, Play } from 'lucide-react';
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
  HOLD_REASON: 'border-l-4 border-[rgb(var(--color-goal-hold))] bg-[rgba(var(--color-goal-hold),0.08)]',
  BLOCK_REASON: 'border-l-4 border-[rgb(var(--color-goal-blocked))] bg-[rgba(var(--color-goal-blocked),0.08)]',
  COMMENT: '',
};

const COMMENT_TYPE_CHIP: Record<string, { text: string; className: string }> = {
  APPROVAL: { text: 'APPROVAL', className: 'bg-success-muted text-success' },
  REVISION_REQUEST: { text: 'REVISION REQUEST', className: 'bg-warning-muted text-warning' },
  DISCUSSION_REQUEST: { text: 'DISCUSSION', className: 'bg-info-muted text-info' },
  HOLD_REASON: { text: 'HOLD REASON', className: 'bg-[rgba(var(--color-goal-hold),0.15)] text-[rgb(var(--color-goal-hold))]' },
  BLOCK_REASON: { text: 'BLOCK REASON', className: 'bg-[rgba(var(--color-goal-blocked),0.15)] text-[rgb(var(--color-goal-blocked))]' },
};

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [showRevise, setShowRevise] = useState(false);
  const [reviseComment, setReviseComment] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTargetDate, setEditTargetDate] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');

  const [showDelete, setShowDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [pauseMode, setPauseMode] = useState<null | 'hold' | 'block'>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pauseError, setPauseError] = useState('');

  const [resumeBusy, setResumeBusy] = useState(false);

  const flashMsg = (type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  };

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
    const res = await fetch(`/api/goals/${goalId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (res.ok) { flashMsg('success', 'Goal approved'); await fetchGoal(); }
    else flashMsg('error', 'Failed to approve');
  };

  const handleRevise = async () => {
    if (!reviseComment.trim()) return;
    const res = await fetch(`/api/goals/${goalId}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: reviseComment }) });
    if (res.ok) {
      setShowRevise(false); setReviseComment('');
      flashMsg('success', 'Revision requested');
      await fetchGoal();
    } else flashMsg('error', 'Failed to request revision');
  };

  const handleStatusChange = async (status: string) => {
    const res = await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { flashMsg('success', `Goal moved to ${status.toLowerCase().replace('_', ' ')}`); await fetchGoal(); }
    else {
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to update status');
    }
  };

  const openEdit = () => {
    if (!goal) return;
    setEditTitle(goal.title);
    setEditDescription(goal.description || '');
    setEditTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '');
    setEditError('');
    setShowEdit(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setEditBusy(true); setEditError('');
    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        targetDate: editTargetDate || null,
      }),
    });
    if (res.ok) {
      setShowEdit(false);
      flashMsg('success', 'Goal updated');
      await fetchGoal();
    } else {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error || 'Failed to save changes');
    }
    setEditBusy(false);
  };

  const handleConfirmDelete = async () => {
    setDeleteBusy(true); setDeleteError('');
    const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard/goals');
    } else {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error || 'Failed to delete goal');
      setDeleteBusy(false);
    }
  };

  const openPause = (mode: 'hold' | 'block') => {
    setPauseMode(mode);
    setPauseReason('');
    setPauseError('');
  };

  const handleSubmitPause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pauseMode || !pauseReason.trim()) return;
    setPauseBusy(true); setPauseError('');
    const res = await fetch(`/api/goals/${goalId}/${pauseMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: pauseReason.trim() }),
    });
    if (res.ok) {
      setPauseMode(null); setPauseReason('');
      flashMsg('success', pauseMode === 'hold' ? 'Goal placed on hold' : 'Goal flagged as blocked');
      await fetchGoal();
    } else {
      const d = await res.json().catch(() => ({}));
      setPauseError(d.error || 'Failed to update goal');
    }
    setPauseBusy(false);
  };

  const handleResume = async () => {
    setResumeBusy(true);
    const res = await fetch(`/api/goals/${goalId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) { flashMsg('success', 'Goal resumed'); await fetchGoal(); }
    else {
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to resume');
    }
    setResumeBusy(false);
  };

  if (loading) return <DashboardLayout type="employee"><div className="max-w-3xl mx-auto pt-4"><PageSkeleton type="detail" /></div></DashboardLayout>;
  if (!goal) return <DashboardLayout type="employee"><div className="text-center py-12 text-error">Goal not found</div></DashboardLayout>;

  const isOwner = goal.ownerId === session?.user?.id;
  const isAdmin = session?.user?.role === 'ADMIN';
  const isManager = session?.user?.role === 'MANAGER' || isAdmin;
  const isManagerOfOwner = isAdmin || (session?.user?.role === 'MANAGER' && goal.owner.managerId === session?.user?.id);

  const canEditContent = isAdmin || isManagerOfOwner || (isOwner && (goal.status === 'DRAFT' || goal.status === 'NEEDS_REVISION'));
  const canDelete = isAdmin || (isOwner && goal.status === 'DRAFT');
  const canPause = (isOwner || isManagerOfOwner || isAdmin) && goal.status === 'ACTIVE';
  const canResume = (isOwner || isManagerOfOwner || isAdmin) && (goal.status === 'ON_HOLD' || goal.status === 'BLOCKED');

  return (
    <DashboardLayout type="employee">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/goals" className="text-secondary hover:text-primary focus-ring rounded p-1 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl font-bold text-primary truncate">{goal.title}</h1>
              <StatusBadge status={goal.status} />
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canEditContent && (
              <button
                onClick={openEdit}
                className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                aria-label="Edit goal"
                title="Edit goal"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { setShowDelete(true); setDeleteError(''); }}
                className="focus-ring rounded-lg p-2 text-tertiary hover:text-error hover:bg-error-muted transition-colors"
                aria-label="Delete goal"
                title="Delete goal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {flash && (
          <div className={`px-4 py-2 rounded-xl text-sm border ${
            flash.type === 'success' ? 'bg-success-muted text-success border-theme' : 'bg-error-muted text-error border-theme'
          }`}>
            {flash.msg}
          </div>
        )}

        <div className="card-interactive p-5 space-y-4">
          {goal.description && <p className="text-sm text-secondary whitespace-pre-wrap">{goal.description}</p>}

          <div className="flex flex-wrap gap-4 text-xs text-tertiary">
            <span>Owner: <strong className="text-primary">{goal.owner.name}</strong></span>
            {goal.assigner && <span>Assigned by: <strong className="text-primary">{goal.assigner.name}</strong></span>}
            {goal.targetDate && <span>Due: <strong className="text-primary">{new Date(goal.targetDate).toLocaleDateString()}</strong></span>}
          </div>

          {(goal.status === 'ACTIVE' || goal.status === 'ON_HOLD' || goal.status === 'BLOCKED') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-secondary">Progress</span>
                <span className="text-sm font-bold text-primary">{goal.progress}%</span>
              </div>
              <div className="h-3 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${goal.progress}%`,
                    backgroundColor:
                      goal.status === 'ON_HOLD' ? 'rgb(var(--color-goal-hold))' :
                      goal.status === 'BLOCKED' ? 'rgb(var(--color-goal-blocked))' :
                      'rgb(var(--color-goal-active))',
                  }}
                />
              </div>
            </div>
          )}

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
                <button onClick={() => { setShowRevise(true); setReviseComment(''); }} className="px-4 py-2 bg-[rgba(var(--color-goal-revision),0.1)] text-[rgb(var(--color-goal-revision))] rounded-xl text-sm font-medium focus-ring hover:bg-[rgba(var(--color-goal-revision),0.2)]">Needs Revision</button>
              </>
            )}
            {goal.status === 'ACTIVE' && isOwner && (
              <button onClick={() => handleStatusChange('COMPLETED')} className="px-4 py-2 bg-success text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring">Mark Complete</button>
            )}
            {canPause && (
              <>
                <button
                  onClick={() => openPause('hold')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium focus-ring bg-[rgba(var(--color-goal-hold),0.1)] text-[rgb(var(--color-goal-hold))] hover:bg-[rgba(var(--color-goal-hold),0.2)]"
                >
                  <Pause className="w-4 h-4" /> Put on Hold
                </button>
                <button
                  onClick={() => openPause('block')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium focus-ring bg-[rgba(var(--color-goal-blocked),0.1)] text-[rgb(var(--color-goal-blocked))] hover:bg-[rgba(var(--color-goal-blocked),0.2)]"
                >
                  <Ban className="w-4 h-4" /> Flag Blocked
                </button>
              </>
            )}
            {canResume && (
              <button
                onClick={handleResume}
                disabled={resumeBusy}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-success text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring disabled:opacity-60"
              >
                <Play className="w-4 h-4" /> {resumeBusy ? 'Resuming...' : 'Resume Goal'}
              </button>
            )}
            {goal.status !== 'CLOSED' && goal.status !== 'COMPLETED' && (
              <button onClick={() => handleStatusChange('CLOSED')} className="px-3 py-2 text-sm text-tertiary hover:text-error focus-ring rounded-lg">Close Goal</button>
            )}
          </div>
        </div>

        <div className="card-section">
          <div className="px-5 py-3 border-b border-theme flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-primary">Discussion ({goal.comments.length})</h3>
          </div>

          <div className="divide-y divide-[rgb(var(--color-border-theme))]">
            {goal.comments.length === 0 ? (
              <p className="text-center text-xs text-tertiary py-8">No comments yet. Start the conversation.</p>
            ) : (
              goal.comments.map((comment) => {
                const chip = COMMENT_TYPE_CHIP[comment.type];
                return (
                  <div key={comment.id} className={`px-5 py-3 ${COMMENT_TYPE_STYLES[comment.type] || ''}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-primary">{comment.authorId === session?.user?.id ? 'You' : 'Manager'}</span>
                      {chip && (
                        <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${chip.className}`}>
                          {chip.text}
                        </span>
                      )}
                      <span className="text-2xs text-tertiary">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-secondary whitespace-pre-wrap">{comment.content}</p>
                  </div>
                );
              })
            )}
          </div>

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

      <Modal open={showRevise} onClose={() => setShowRevise(false)} title="Request Revision"
        icon={<span className="text-[rgb(var(--color-goal-revision))]">↩</span>}>
        <form onSubmit={(e) => { e.preventDefault(); handleRevise(); }} className="space-y-4">
          <p className="text-sm text-secondary">Explain what needs to change so the employee can improve their goal.</p>
          <textarea value={reviseComment} onChange={(e) => setReviseComment(e.target.value)} rows={4}
            className="input-textarea" placeholder="Be specific about what needs to change..." autoFocus />
          <FormActions onCancel={() => setShowRevise(false)} submitLabel="Send Revision Request" disabled={!reviseComment.trim()} />
        </form>
      </Modal>

      <Modal open={showEdit} onClose={() => !editBusy && setShowEdit(false)} title="Edit Goal"
        icon={<Pencil className="w-5 h-5 text-accent" />}>
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="input-label">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input-base"
              maxLength={200}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className="input-textarea"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="input-label">Target Date</label>
            <input
              type="date"
              value={editTargetDate}
              onChange={(e) => setEditTargetDate(e.target.value)}
              className="input-base"
            />
          </div>
          {editError && <p className="text-xs text-error">{editError}</p>}
          <FormActions
            onCancel={() => setShowEdit(false)}
            submitLabel="Save Changes"
            loading={editBusy}
            disabled={!editTitle.trim()}
          />
        </form>
      </Modal>

      <Modal open={showDelete} onClose={() => !deleteBusy && setShowDelete(false)} title="Delete Goal"
        icon={<AlertTriangle className="w-5 h-5 text-error" />}>
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete <strong className="text-primary">{goal.title}</strong>?
            This permanently removes the goal and all its comments. This cannot be undone.
          </p>
          {!isAdmin && goal.status !== 'DRAFT' && (
            <p className="text-xs text-warning bg-warning-muted p-3 rounded-lg">
              You can only delete DRAFT goals. Close the goal instead to keep its history.
            </p>
          )}
          {deleteError && <p className="text-xs text-error">{deleteError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowDelete(false)} disabled={deleteBusy} className="btn-secondary flex-1">Cancel</button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteBusy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--color-error))] text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 focus-ring shadow-sm transition-all disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {deleteBusy ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={pauseMode !== null}
        onClose={() => !pauseBusy && setPauseMode(null)}
        title={pauseMode === 'hold' ? 'Put Goal on Hold' : 'Flag Goal as Blocked'}
        icon={
          pauseMode === 'hold'
            ? <Pause className="w-5 h-5" style={{ color: 'rgb(var(--color-goal-hold))' }} />
            : <Ban className="w-5 h-5" style={{ color: 'rgb(var(--color-goal-blocked))' }} />
        }
      >
        <form onSubmit={handleSubmitPause} className="space-y-4">
          <p className="text-sm text-secondary">
            {pauseMode === 'hold'
              ? 'Temporarily pause progress on this goal (e.g., waiting on a dependency). Add a reason so the team has context.'
              : 'Flag this goal as blocked by an external issue. Add a reason so the team and manager can unblock it.'}
          </p>
          <div>
            <label className="input-label">Reason <span className="text-error">*</span></label>
            <textarea
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              rows={4}
              maxLength={1000}
              className="input-textarea"
              placeholder={pauseMode === 'hold'
                ? 'e.g., Waiting on design review from Priya; will resume after her feedback.'
                : 'e.g., Blocked by vendor API outage; waiting for vendor fix.'}
              autoFocus
            />
          </div>
          {pauseError && <p className="text-xs text-error">{pauseError}</p>}
          <FormActions
            onCancel={() => setPauseMode(null)}
            submitLabel={pauseMode === 'hold' ? 'Put on Hold' : 'Flag as Blocked'}
            loading={pauseBusy}
            disabled={!pauseReason.trim()}
          />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
