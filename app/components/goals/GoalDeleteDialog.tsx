'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from '@/app/components/shared/Modal';
import type { Goal, FlashFn } from './types';

interface Props {
  goal: Goal | null;
  isAdmin: boolean;
  onClose: () => void;
  onDeleted: () => void;
  flash: FlashFn;
}

export default function GoalDeleteDialog({ goal, isAdmin, onClose, onDeleted, flash }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!goal) return;
    setBusy(false);
    setError('');
  }, [goal]);

  const handleConfirm = async () => {
    if (!goal) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/goals/${goal.id}`, { method: 'DELETE' });
    if (res.ok) {
      onClose();
      onDeleted();
      flash('success', 'Goal deleted');
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to delete goal');
    }
    setBusy(false);
  };

  return (
    <Modal
      open={!!goal}
      onClose={() => !busy && onClose()}
      title="Delete Goal"
      icon={<AlertTriangle className="w-5 h-5 text-error" />}
    >
      <div className="space-y-4">
        <p className="text-sm text-secondary">
          Are you sure you want to delete{' '}
          <strong className="text-primary">{goal?.title}</strong>? This permanently removes the goal
          and all its comments. This cannot be undone.
        </p>
        {goal && !isAdmin && goal.status !== 'DRAFT' && (
          <p className="text-xs text-warning bg-warning-muted p-3 rounded-lg">
            You can only delete DRAFT goals. Close the goal instead to keep its history.
          </p>
        )}
        {error && <p className="text-xs text-error">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--color-error))] text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 focus-ring shadow-sm transition-all disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
