'use client';

import { useEffect, useState } from 'react';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import type { FlashFn } from './types';

interface Props {
  goalId: string | null;
  onClose: () => void;
  onRevised: () => void;
  flash: FlashFn;
}

export default function GoalReviseModal({ goalId, onClose, onRevised, flash }: Props) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!goalId) return;
    setComment('');
    setBusy(false);
  }, [goalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId || !comment.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/goals/${goalId}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
    if (res.ok) {
      onClose();
      onRevised();
      flash('success', 'Revision requested');
    } else {
      const d = await res.json().catch(() => ({}));
      flash('error', d.error || 'Failed to request revision');
    }
    setBusy(false);
  };

  return (
    <Modal
      open={!!goalId}
      onClose={() => !busy && onClose()}
      title="Request Revision"
      icon={<span className="text-[rgb(var(--color-goal-revision))]">↩</span>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-secondary">
          Explain what needs to change so the employee can improve their goal.
        </p>
        <div>
          <label className="input-label">
            What needs to change? <span className="text-error">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="input-textarea"
            placeholder="Be specific — e.g., 'The target date seems too aggressive, consider extending to end of quarter. Also add measurable success criteria.'"
            autoFocus
          />
        </div>
        <FormActions
          onCancel={onClose}
          submitLabel="Send Revision Request"
          loading={busy}
          disabled={!comment.trim()}
        />
      </form>
    </Modal>
  );
}
