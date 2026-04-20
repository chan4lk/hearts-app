'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ToggleLeft, ToggleRight, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface CompanyValue {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: { hearts: number };
}

export default function AdminValuesPage() {
  const [values, setValues] = useState<CompanyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  const [newValueName, setNewValueName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [editing, setEditing] = useState<CompanyValue | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleting, setDeleting] = useState<CompanyValue | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const flashMsg = (type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  };

  const fetchValues = useCallback(async () => {
    const res = await fetch('/api/admin/values');
    if (res.ok) setValues(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchValues(); }, [fetchValues]);

  const visibleValues = useMemo(
    () => (showInactive ? values : values.filter((v) => v.isActive)),
    [values, showInactive]
  );

  const activeCount = values.filter((v) => v.isActive).length;
  const totalHearts = values.reduce((sum, v) => sum + v._count.hearts, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValueName.trim()) return;
    setCreating(true); setCreateError('');
    const res = await fetch('/api/admin/values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newValueName.trim() }),
    });
    if (res.ok) {
      setNewValueName('');
      await fetchValues();
      flashMsg('success', 'Value created');
    } else {
      const d = await res.json().catch(() => ({}));
      setCreateError(d.error || 'Failed to create value');
    }
    setCreating(false);
  };

  const handleToggle = async (v: CompanyValue) => {
    const res = await fetch(`/api/admin/values/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    if (res.ok) {
      await fetchValues();
      flashMsg('success', v.isActive ? 'Value deactivated' : 'Value activated');
    } else {
      flashMsg('error', 'Failed to update value');
    }
  };

  const openEdit = (v: CompanyValue) => {
    setEditing(v);
    setEditName(v.name);
    setEditIsActive(v.isActive);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editName.trim()) return;
    setSaving(true); setEditError('');
    const res = await fetch(`/api/admin/values/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), isActive: editIsActive }),
    });
    if (res.ok) {
      setEditing(null);
      await fetchValues();
      flashMsg('success', 'Value updated');
    } else {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error || 'Failed to save value');
    }
    setSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true); setDeleteError('');
    const res = await fetch(`/api/admin/values/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleting(null);
      await fetchValues();
      flashMsg('success', 'Value deleted');
    } else {
      const d = await res.json().catch(() => ({}));
      setDeleteError(d.error || 'Failed to delete value');
    }
    setDeleteBusy(false);
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="page-title">
            <Heart className="w-6 h-6" style={{ color: 'rgb(var(--color-heart))' }} />
            Company Values
          </h1>
          <p className="page-subtitle">Configure the values employees can recognize each other for</p>
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

        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Values', value: values.length },
              { label: 'Active', value: activeCount },
              { label: 'Total Hearts', value: totalHearts },
            ].map(({ label, value }) => (
              <div key={label} className="card-stat text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-2xs text-tertiary">{label}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleCreate} className="card-stat">
          <label className="input-label">Add New Value</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newValueName}
              onChange={(e) => setNewValueName(e.target.value)}
              placeholder="e.g., Innovation, Teamwork, Ownership..."
              className="input-base"
              maxLength={50}
            />
            <button
              type="submit"
              disabled={creating || !newValueName.trim()}
              className="btn-primary inline-flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> {creating ? 'Adding...' : 'Add'}
            </button>
          </div>
          {createError && <p className="text-xs text-error mt-2">{createError}</p>}
        </form>

        <div className="flex items-center justify-between">
          <p className="text-xs text-tertiary">
            {visibleValues.length} of {values.length} value{values.length === 1 ? '' : 's'}
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
        ) : visibleValues.length === 0 ? (
          <div className="empty-container">
            <div
              className="empty-icon-ring"
              style={{ backgroundColor: 'rgba(var(--color-heart),0.1)' }}
            >
              <Heart className="w-10 h-10" style={{ color: 'rgb(var(--color-heart))' }} />
            </div>
            <p className="empty-title">
              {values.length === 0 ? 'No company values yet' : 'No values match the current filter'}
            </p>
            <p className="empty-description">
              {values.length === 0
                ? 'Add values above so employees can recognize each other'
                : 'Toggle "Show inactive" to see deactivated values'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {visibleValues.map((v) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={`flex items-start justify-between gap-3 p-4 card-interactive cursor-pointer ${
                    !v.isActive ? 'opacity-70' : ''
                  }`}
                  onClick={() => openEdit(v)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEdit(v);
                    }
                  }}
                  aria-label={`Edit value ${v.name}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`icon-box-md flex-shrink-0 ${
                        v.isActive
                          ? 'bg-[rgba(var(--color-heart),0.1)]'
                          : 'bg-surface-secondary'
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          v.isActive ? 'text-[rgb(var(--color-heart))]' : 'text-tertiary'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-primary truncate">{v.name}</p>
                      <p className="text-xs text-tertiary">
                        {v._count.hearts} {v._count.hearts === 1 ? 'heart' : 'hearts'} given
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {!v.isActive ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-warning-muted text-warning border border-theme"
                        aria-label="Inactive value"
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
                        onClick={() => openEdit(v)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                        aria-label={`Edit ${v.name}`}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(v)}
                        className="focus-ring rounded-lg p-1"
                        aria-label={v.isActive ? `Deactivate ${v.name}` : `Activate ${v.name}`}
                        title={v.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {v.isActive ? (
                          <ToggleRight className="w-8 h-8 text-success" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-tertiary" />
                        )}
                      </button>
                      <button
                        onClick={() => { setDeleting(v); setDeleteError(''); }}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-error hover:bg-error-muted transition-colors"
                        aria-label={`Delete ${v.name}`}
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
        title="Edit Value"
        icon={<Pencil className="w-5 h-5 text-accent" />}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="input-label">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-base"
              maxLength={50}
              required
              autoFocus
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
          {editing && editing._count.hearts > 0 && (
            <p className="text-xs text-tertiary">
              Note: {editing._count.hearts} heart{editing._count.hearts === 1 ? '' : 's'} already
              tagged with this value. Renaming updates their display label too.
            </p>
          )}
          {editError && <p className="text-xs text-error">{editError}</p>}
          <FormActions
            onCancel={() => setEditing(null)}
            submitLabel="Save Changes"
            loading={saving}
            disabled={!editName.trim()}
          />
        </form>
      </Modal>

      <Modal
        open={!!deleting}
        onClose={() => !deleteBusy && setDeleting(null)}
        title="Delete Value"
        icon={<AlertTriangle className="w-5 h-5 text-error" />}
      >
        <div className="space-y-4">
          {deleting && deleting._count.hearts > 0 ? (
            <>
              <p className="text-sm text-secondary">
                <strong className="text-primary">{deleting.name}</strong> cannot be deleted because{' '}
                <strong className="text-primary">
                  {deleting._count.hearts} heart{deleting._count.hearts === 1 ? '' : 's'}
                </strong>{' '}
                already reference it. Deleting it would erase recognition history.
              </p>
              <p className="text-sm text-secondary">
                Deactivate it instead — it will be hidden from the Heart picker but existing hearts
                stay intact.
              </p>
              {deleteError && <p className="text-xs text-error">{deleteError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleting(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                {deleting.isActive && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleToggle(deleting);
                      setDeleting(null);
                    }}
                    className="btn-primary flex-1"
                  >
                    Deactivate Instead
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-secondary">
                Are you sure you want to delete{' '}
                <strong className="text-primary">{deleting?.name}</strong>? This action cannot be
                undone.
              </p>
              {deleteError && <p className="text-xs text-error">{deleteError}</p>}
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
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
