'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, ToggleLeft, ToggleRight, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface GoalTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [editing, setEditing] = useState<GoalTemplate | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleting, setDeleting] = useState<GoalTemplate | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const flashMsg = (type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  };

  const fetchTemplates = useCallback(async () => {
    const url = showInactive ? '/api/goals/templates?includeInactive=true' : '/api/goals/templates';
    const res = await fetch(url);
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, [showInactive]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true); setCreateError('');
    const res = await fetch('/api/goals/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
      }),
    });
    if (res.ok) {
      setTitle(''); setDescription(''); setCategory('');
      await fetchTemplates();
      flashMsg('success', 'Template created');
    } else {
      const d = await res.json().catch(() => ({}));
      setCreateError(d.error || 'Failed to create template');
    }
    setCreating(false);
  };

  const handleToggle = async (t: GoalTemplate) => {
    const res = await fetch(`/api/goals/templates/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    if (res.ok) {
      await fetchTemplates();
      flashMsg('success', t.isActive ? 'Template deactivated' : 'Template activated');
    } else {
      flashMsg('error', 'Failed to update template');
    }
  };

  const openEdit = (t: GoalTemplate) => {
    setEditing(t);
    setEditTitle(t.title);
    setEditDescription(t.description || '');
    setEditCategory(t.category || '');
    setEditIsActive(t.isActive);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editTitle.trim()) return;
    setSaving(true); setEditError('');
    const res = await fetch(`/api/goals/templates/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        category: editCategory.trim() ? editCategory.trim() : null,
        isActive: editIsActive,
      }),
    });
    if (res.ok) {
      setEditing(null);
      await fetchTemplates();
      flashMsg('success', 'Template updated');
    } else {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error || 'Failed to save template');
    }
    setSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/goals/templates/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleting(null);
      await fetchTemplates();
      flashMsg('success', 'Template deleted');
    } else {
      flashMsg('error', 'Failed to delete template');
    }
    setDeleteBusy(false);
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">
            <Target className="w-6 h-6" style={{ color: 'rgb(var(--color-goal-active))' }} />
            Goal Templates
          </h1>
          <p className="page-subtitle">Create reusable templates for quick goal creation</p>
        </div>

        {flash && (
          <div
            className={`px-4 py-2 rounded-xl text-sm border ${
              flash.type === 'success'
                ? 'bg-success-muted text-success border-theme'
                : 'bg-error-muted text-error border-theme'
            }`}
          >
            {flash.msg}
          </div>
        )}

        <form onSubmit={handleCreate} className="card-stat space-y-3">
          <label className="input-label">New Template</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template title (e.g., Complete Q1 OKRs)"
            className="input-base"
            maxLength={200}
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="input-textarea"
            maxLength={2000}
          />
          <div className="flex gap-3">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (optional)"
              className="input-base"
              maxLength={50}
            />
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="btn-primary inline-flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> {creating ? 'Adding...' : 'Add'}
            </button>
          </div>
          {createError && <p className="text-xs text-error">{createError}</p>}
        </form>

        <div className="flex items-center justify-between">
          <p className="text-xs text-tertiary">
            {templates.length} template{templates.length === 1 ? '' : 's'}
            {showInactive ? ' (including inactive)' : ' (active only)'}
          </p>
          <label className="inline-flex items-center gap-2 text-xs text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="focus-ring"
            />
            Show inactive
          </label>
        </div>

        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : templates.length === 0 ? (
          <div className="empty-container">
            <div
              className="empty-icon-ring"
              style={{ backgroundColor: 'rgba(var(--color-goal-active),0.1)' }}
            >
              <Target className="w-10 h-10" style={{ color: 'rgb(var(--color-goal-active))' }} />
            </div>
            <p className="empty-title">No goal templates yet</p>
            <p className="empty-description">Create templates above for quick goal creation</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {templates.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`flex items-start justify-between gap-3 p-4 card-interactive cursor-pointer ${
                    !t.isActive ? 'opacity-70' : ''
                  }`}
                  onClick={() => openEdit(t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEdit(t);
                    }
                  }}
                  aria-label={`Edit template ${t.title}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`icon-box-md flex-shrink-0 ${
                        t.isActive
                          ? 'bg-[rgba(var(--color-goal-active),0.1)]'
                          : 'bg-surface-secondary'
                      }`}
                    >
                      <Target
                        className={`w-5 h-5 ${
                          t.isActive ? 'text-[rgb(var(--color-goal-active))]' : 'text-tertiary'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{t.title}</p>
                      <p className="text-xs text-tertiary flex items-center gap-1 flex-wrap">
                        {t.category && (
                          <span className="badge-base bg-surface-secondary text-secondary">
                            {t.category}
                          </span>
                        )}
                        {t.description && <span className="line-clamp-1">{t.description}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {!t.isActive ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-warning-muted text-warning border border-theme"
                        aria-label="Inactive template"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: 'rgb(var(--color-warning))' }}
                        />
                        Inactive
                      </span>
                    ) : (
                      <span className="h-[18px]" aria-hidden="true" />
                    )}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(t)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                        aria-label={`Edit ${t.title}`}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(t)}
                        className="focus-ring rounded-lg p-1"
                        aria-label={t.isActive ? `Deactivate ${t.title}` : `Activate ${t.title}`}
                        title={t.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {t.isActive ? (
                          <ToggleRight className="w-8 h-8 text-success" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-tertiary" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-error hover:bg-error-muted transition-colors"
                        aria-label={`Delete ${t.title}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Template"
        icon={<Pencil className="w-5 h-5 text-accent" />}
      >
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
              className="input-textarea"
              rows={3}
              maxLength={2000}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="input-label">Category</label>
            <input
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="input-base"
              maxLength={50}
              placeholder="Optional"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="focus-ring"
            />
            Active
          </label>
          {editError && <p className="text-xs text-error">{editError}</p>}
          <FormActions
            onCancel={() => setEditing(null)}
            submitLabel="Save Changes"
            loading={saving}
            disabled={!editTitle.trim()}
          />
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Delete Template"
        icon={<AlertTriangle className="w-5 h-5 text-error" />}
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete <strong className="text-primary">{deleting?.title}</strong>?
            This action cannot be undone. Existing goals created from this template are not affected.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={deleteBusy}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
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
    </DashboardLayout>
  );
}
