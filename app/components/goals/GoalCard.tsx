'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { Goal } from './types';

interface Props {
  goal: Goal;
  index: number;
  currentUserId: string | undefined;
  currentUserName: string | undefined;
  isManager: boolean;
  isAdmin: boolean;
  onStatusChange: (goalId: string, status: string) => void;
  onApprove: (goalId: string) => void;
  onRequestRevise: (goalId: string) => void;
  onProgressPreview: (goalId: string, progress: number) => void;
  onProgressCommit: (goalId: string, progress: number) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

const stop = (fn: () => void) => (e: React.MouseEvent) => {
  e.stopPropagation();
  fn();
};

export default function GoalCard({
  goal,
  index,
  currentUserId,
  currentUserName,
  isManager,
  isAdmin,
  onStatusChange,
  onApprove,
  onRequestRevise,
  onProgressPreview,
  onProgressCommit,
  onEdit,
  onDelete,
}: Props) {
  const router = useRouter();
  const isOwner = goal.ownerId === currentUserId;
  const canEdit = isAdmin || (isOwner && (goal.status === 'DRAFT' || goal.status === 'NEEDS_REVISION'));
  const canDelete = isAdmin || (isOwner && goal.status === 'DRAFT');

  const openDetail = () => router.push(`/dashboard/goals/${goal.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      role="button"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      className="card-interactive p-5 group cursor-pointer focus-ring"
      aria-label={`Open goal ${goal.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-primary truncate group-hover:text-accent transition-colors">
              {goal.title}
            </span>
            <StatusBadge status={goal.status} />
            {goal.category && (
              <span className="badge-base bg-surface-secondary text-secondary">
                {goal.category}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {goal.description && (
            <p className="text-xs text-secondary line-clamp-2 mb-2">{goal.description}</p>
          )}
          <div className="flex items-center gap-3 text-2xs text-tertiary">
            {goal.owner.name !== currentUserName && (
              <span>
                Owner: <strong className="text-secondary">{goal.owner.name}</strong>
              </span>
            )}
            {goal.assigner && (
              <span>
                By: <strong className="text-secondary">{goal.assigner.name}</strong>
              </span>
            )}
            {goal.targetDate && <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>}
            {goal._count.comments > 0 && <span>💬 {goal._count.comments}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {goal.status === 'DRAFT' && isOwner && (
            <button
              onClick={stop(() => onStatusChange(goal.id, 'PENDING'))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-pending),0.1)] text-[rgb(var(--color-goal-pending))] hover:bg-[rgba(var(--color-goal-pending),0.2)] focus-ring"
            >
              Submit
            </button>
          )}
          {goal.status === 'NEEDS_REVISION' && isOwner && (
            <button
              onClick={stop(() => onStatusChange(goal.id, 'PENDING'))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-revision),0.1)] text-[rgb(var(--color-goal-revision))] hover:bg-[rgba(var(--color-goal-revision),0.2)] focus-ring"
            >
              Resubmit
            </button>
          )}
          {goal.status === 'PENDING' && isManager && (
            <>
              <button
                onClick={stop(() => onApprove(goal.id))}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-completed),0.1)] text-[rgb(var(--color-goal-completed))] hover:bg-[rgba(var(--color-goal-completed),0.2)] focus-ring"
              >
                Approve
              </button>
              <button
                onClick={stop(() => onRequestRevise(goal.id))}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-revision),0.1)] text-[rgb(var(--color-goal-revision))] hover:bg-[rgba(var(--color-goal-revision),0.2)] focus-ring"
              >
                Revise
              </button>
            </>
          )}
          {goal.status === 'ACTIVE' && isOwner && (
            <button
              onClick={stop(() => onStatusChange(goal.id, 'COMPLETED'))}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-completed),0.1)] text-[rgb(var(--color-goal-completed))] hover:bg-[rgba(var(--color-goal-completed),0.2)] focus-ring"
            >
              Complete
            </button>
          )}
          {canEdit && (
            <button
              onClick={stop(() => onEdit(goal))}
              className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
              aria-label={`Edit ${goal.title}`}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={stop(() => onDelete(goal))}
              className="focus-ring rounded-lg p-2 text-tertiary hover:text-error hover:bg-error-muted transition-colors"
              aria-label={`Delete ${goal.title}`}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {goal.status === 'ACTIVE' && (
        <div className="mt-3 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${goal.progress}%`, backgroundColor: 'rgb(var(--color-goal-active))' }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={goal.progress}
            onChange={(e) => onProgressPreview(goal.id, parseInt(e.target.value))}
            onMouseUp={(e) => onProgressCommit(goal.id, parseInt((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => onProgressCommit(goal.id, parseInt((e.target as HTMLInputElement).value))}
            className="w-16 accent-[rgb(var(--color-goal-active))]"
            aria-label={`Progress: ${goal.progress}%`}
          />
          <span className="text-xs font-bold text-primary w-8 text-right">{goal.progress}%</span>
        </div>
      )}
    </motion.div>
  );
}
