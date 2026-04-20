'use client';

import { useEffect, useState } from 'react';
import { Target, X } from 'lucide-react';
import Modal from '@/app/components/shared/Modal';
import TemplatePicker, { GoalTemplate } from '@/app/components/goals/TemplatePicker';
import type { FlashFn } from './types';

const todayStr = () => new Date().toISOString().split('T')[0];
const makeEmptyGoal = () => ({ title: '', description: '', category: '', targetDate: todayStr() });

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
}

interface Props {
  open: boolean;
  isManager: boolean;
  onClose: () => void;
  onCreated: () => void;
  flash: FlashFn;
}

export default function GoalCreateModal({ open, isManager, onClose, onCreated, flash }: Props) {
  const [bulkGoals, setBulkGoals] = useState<{ title: string; description: string; category: string; targetDate: string }[]>([makeEmptyGoal()]);
  const [creating, setCreating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    if (!open) return;
    setBulkGoals([makeEmptyGoal()]);
    setCreating(false);
    fetch('/api/goals/templates')
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [open]);

  const addGoalRow = () => setBulkGoals((prev) => [...prev, makeEmptyGoal()]);
  const removeGoalRow = (i: number) => setBulkGoals((prev) => prev.filter((_, idx) => idx !== i));
  const updateGoalRow = (i: number, field: 'title' | 'description' | 'category' | 'targetDate', value: string) =>
    setBulkGoals((prev) => prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)));

  const applyTemplate = (i: number, t: GoalTemplate) => {
    setBulkGoals((prev) =>
      prev.map((g, idx) =>
        idx === i
          ? {
              ...g,
              title: t.title,
              description: t.description || '',
              category: t.category || g.category,
            }
          : g
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validGoals = bulkGoals.filter((g) => g.title.trim());
    if (validGoals.length === 0) return;
    setCreating(true);

    const body = {
      goals: validGoals.map((g) => ({
        title: g.title,
        description: g.description || undefined,
        category: g.category || undefined,
        targetDate: g.targetDate || undefined,
      })),
    };

    const res = await fetch('/api/goals/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({ created: validGoals.length }));
      onClose();
      onCreated();
      flash('success', `Created ${data.created} goal${data.created === 1 ? '' : 's'}`);
    } else {
      const d = await res.json().catch(() => ({}));
      flash('error', d.error || 'Failed to create goals');
    }
    setCreating(false);
  };

  const submittable = bulkGoals.filter((g) => g.title.trim()).length;

  return (
    <Modal
      open={open}
      onClose={() => !creating && onClose()}
      title="Create Goals"
      icon={<Target className="w-5 h-5" style={{ color: 'rgb(var(--color-goal-active))' }} />}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {bulkGoals.map((goal, i) => (
          <div key={i} className="p-4 bg-surface-secondary rounded-xl space-y-3 relative">
            {bulkGoals.length > 1 && (
              <button
                type="button"
                onClick={() => removeGoalRow(i)}
                className="absolute top-2 right-2 text-tertiary hover:text-error focus-ring rounded p-0.5"
                aria-label={`Remove goal ${i + 1}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center justify-between">
              <span className="text-2xs text-tertiary font-semibold">Goal {i + 1}</span>
              {templates.length > 0 && (
                <TemplatePicker templates={templates} onSelect={(t) => applyTemplate(i, t)} />
              )}
            </div>
            <input
              value={goal.title}
              onChange={(e) => updateGoalRow(i, 'title', e.target.value)}
              required
              maxLength={200}
              className="input-base"
              placeholder="Goal title"
            />
            <textarea
              value={goal.description}
              onChange={(e) => updateGoalRow(i, 'description', e.target.value)}
              rows={2}
              maxLength={2000}
              className="input-textarea"
              placeholder="Description (optional)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={goal.category}
                onChange={(e) => updateGoalRow(i, 'category', e.target.value)}
                className="input-base"
                maxLength={50}
                placeholder="Category (optional)"
                list="goal-category-options"
                autoComplete="off"
                aria-label={`Category for goal ${i + 1}`}
              />
              <input
                type="date"
                value={goal.targetDate}
                onChange={(e) => updateGoalRow(i, 'targetDate', e.target.value)}
                min={todayStr()}
                className="input-base"
                aria-label={`Target date for goal ${i + 1}`}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addGoalRow}
          className="w-full py-2 border-2 border-dashed border-theme rounded-xl text-xs font-medium text-tertiary hover:text-primary hover:border-accent focus-ring transition-colors"
        >
          + Add Another Goal
        </button>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button type="submit" disabled={creating || submittable === 0} className="btn-primary flex-1">
            {creating ? 'Creating...' : `Create ${submittable} Goal(s)`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
