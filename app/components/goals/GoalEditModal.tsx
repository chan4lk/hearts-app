'use client';

import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import type { Goal, FlashFn } from './types';

interface Props {
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => void;
  flash: FlashFn;
}

export default function GoalEditModal({ goal, onClose, onSaved, flash }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!goal) return;
    setTitle(goal.title);
    setDescription(goal.description || '');
    setCategory(goal.category || '');
    setTargetDate(goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '');
    setError('');
    setBusy(false);
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !title.trim()) return;
    setBusy(true);
    setError('');
    const res = await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        category: category.trim() ? category.trim() : null,
        targetDate: targetDate || null,
      }),
    });
    if (res.ok) {
      onClose();
      onSaved();
      flash('success', 'Goal updated');
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to save changes');
    }
    setBusy(false);
  };

  return (
    <Modal
      open={!!goal}
      onClose={() => !busy && onClose()}
      title="Edit Goal"
      icon={<Pencil className="w-5 h-5 text-accent" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base"
            maxLength={200}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="input-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            className="input-textarea"
            placeholder="Optional"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="input-label">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-base"
              maxLength={50}
              placeholder="Optional"
              list="goal-category-options"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="input-label">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-base"
            />
          </div>
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        <FormActions
          onCancel={onClose}
          submitLabel="Save Changes"
          loading={busy}
          disabled={!title.trim()}
        />
      </form>
    </Modal>
  );
}
