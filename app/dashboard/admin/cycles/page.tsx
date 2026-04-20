'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, X, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  _count: { reviews: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-secondary',
  ACTIVE: 'bg-[rgba(var(--color-review),0.12)] text-[rgb(var(--color-review))]',
  COMPLETED: 'bg-success-muted text-success',
  CLOSED: 'bg-warning-muted text-warning',
};

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('QUARTERLY');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [editing, setEditing] = useState<Cycle | null>(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editType, setEditType] = useState('QUARTERLY');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [deleting, setDeleting] = useState<Cycle | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deletingSubmittedCount, setDeletingSubmittedCount] = useState(0);

  const flashMsg = (type: 'success' | 'error', msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  };

  const fetchCycles = useCallback(async () => {
    const res = await fetch('/api/reviews/cycles');
    if (res.ok) setCycles(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCycles(); }, [fetchCycles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError('');
    const res = await fetch('/api/reviews/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate, type }),
    });
    if (res.ok) {
      const data = await res.json();
      setShowCreate(false);
      setName(''); setStartDate(''); setEndDate(''); setType('QUARTERLY');
      await fetchCycles();
      flashMsg('success', `Cycle created — ${data.reviewsGenerated} review pair${data.reviewsGenerated === 1 ? '' : 's'} generated`);
    } else {
      const d = await res.json().catch(() => ({}));
      setCreateError(d.error || 'Failed to create cycle');
    }
    setCreating(false);
  };

  const openEdit = (c: Cycle) => {
    setEditing(c);
    setEditName(c.name);
    setEditStartDate(new Date(c.startDate).toISOString().split('T')[0]);
    setEditEndDate(new Date(c.endDate).toISOString().split('T')[0]);
    setEditType(c.type);
    setEditStatus(c.status);
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true); setEditError('');
    const res = await fetch(`/api/reviews/cycles/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
        type: editType,
        status: editStatus,
      }),
    });
    if (res.ok) {
      setEditing(null);
      await fetchCycles();
      flashMsg('success', 'Cycle updated');
    } else {
      const d = await res.json().catch(() => ({}));
      setEditError(d.error || 'Failed to save cycle');
    }
    setSaving(false);
  };

  const openDelete = (c: Cycle) => {
    setDeleting(c);
    setDeleteError('');
    setDeletingSubmittedCount(0);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true); setDeleteError('');
    const res = await fetch(`/api/reviews/cycles/${deleting.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleting(null);
      await fetchCycles();
      flashMsg('success', 'Cycle deleted');
    } else {
      const d = await res.json().catch(() => ({}));
      if (d.code === 'IN_USE' && typeof d.submittedCount === 'number') {
        setDeletingSubmittedCount(d.submittedCount);
      }
      setDeleteError(d.error || 'Failed to delete cycle');
    }
    setDeleteBusy(false);
  };

  const handleCloseInstead = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/reviews/cycles/${deleting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    if (res.ok) {
      setDeleting(null);
      await fetchCycles();
      flashMsg('success', 'Cycle closed');
    } else {
      flashMsg('error', 'Failed to close cycle');
    }
    setDeleteBusy(false);
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="page-title">
              <Calendar className="w-6 h-6" style={{ color: 'rgb(var(--color-review))' }} />
              Review Cycles
            </h1>
            <p className="page-subtitle">Create and manage performance review cycles</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Cycle
          </button>
        </div>

        {flash && (
          <div className={`px-4 py-2 rounded-xl text-sm border ${
            flash.type === 'success' ? 'bg-success-muted text-success border-theme' : 'bg-error-muted text-error border-theme'
          }`}>
            {flash.msg}
          </div>
        )}

        {loading ? (
          <PageSkeleton type="cards" count={2} />
        ) : cycles.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon-ring" style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}>
              <Calendar className="w-10 h-10" style={{ color: 'rgb(var(--color-review))' }} />
            </div>
            <p className="empty-title">No review cycles</p>
            <p className="empty-description">Create your first review cycle to start performance reviews</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {cycles.map((cycle, i) => (
                <motion.div
                  key={cycle.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(cycle)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEdit(cycle);
                    }
                  }}
                  className="card-interactive p-5 cursor-pointer focus-ring"
                  aria-label={`Edit cycle ${cycle.name}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="icon-box-lg flex-shrink-0" style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}>
                        <Calendar className="w-6 h-6" style={{ color: 'rgb(var(--color-review))' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3 className="text-sm font-semibold text-primary">{cycle.name}</h3>
                          <span className={`badge-base ${STATUS_STYLES[cycle.status] || 'bg-surface-secondary text-secondary'}`}>
                            {cycle.status}
                          </span>
                        </div>
                        <p className="text-xs text-tertiary">
                          {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()} · {cycle.type.replace('_', ' ')} · {cycle._count.reviews} review{cycle._count.reviews === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(cycle)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-accent hover:bg-accent-muted transition-colors"
                        aria-label={`Edit ${cycle.name}`}
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDelete(cycle)}
                        className="focus-ring rounded-lg p-2 text-tertiary hover:text-error hover:bg-error-muted transition-colors"
                        aria-label={`Delete ${cycle.name}`}
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

        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="modal-panel max-w-md">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Calendar className="w-5 h-5" style={{ color: 'rgb(var(--color-review))' }} /> New Review Cycle
                  </h2>
                  <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-primary focus-ring rounded-lg p-1"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="input-label">Cycle Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Q1 2026" className="input-base" maxLength={100} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="input-label">Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="input-base" /></div>
                    <div><label className="input-label">End Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input-base" /></div>
                  </div>
                  <div>
                    <label className="input-label">Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="input-select w-full">
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="SEMI_ANNUAL">Semi-Annual</option>
                      <option value="ANNUAL">Annual</option>
                    </select>
                  </div>
                  <p className="text-xs text-tertiary">Reviews will be auto-generated for all employees with assigned managers.</p>
                  {createError && <p className="text-xs text-error">{createError}</p>}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? 'Creating...' : 'Create Cycle'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={!!editing}
        onClose={() => !saving && setEditing(null)}
        title="Edit Review Cycle"
        icon={<Pencil className="w-5 h-5 text-accent" />}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="input-label">Cycle Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-base"
              maxLength={100}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Start Date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="input-label">End Date</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="input-base"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Type</label>
              <select value={editType} onChange={(e) => setEditType(e.target.value)} className="input-select w-full">
                <option value="QUARTERLY">Quarterly</option>
                <option value="SEMI_ANNUAL">Semi-Annual</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>
            <div>
              <label className="input-label">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input-select w-full">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
          {editing && editing._count.reviews > 0 && (
            <p className="text-xs text-tertiary">
              Note: {editing._count.reviews} review{editing._count.reviews === 1 ? '' : 's'} already exist for this cycle.
              Changing dates will affect which goals and hearts appear as evidence.
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
        title="Delete Review Cycle"
        icon={<AlertTriangle className="w-5 h-5 text-error" />}
      >
        <div className="space-y-4">
          {deletingSubmittedCount > 0 ? (
            <>
              <p className="text-sm text-secondary">
                <strong className="text-primary">{deleting?.name}</strong> cannot be deleted because{' '}
                <strong className="text-primary">
                  {deletingSubmittedCount} review{deletingSubmittedCount === 1 ? '' : 's'}
                </strong>{' '}
                already {deletingSubmittedCount === 1 ? 'has' : 'have'} submitted data. Deleting it
                would erase review history.
              </p>
              <p className="text-sm text-secondary">
                Close the cycle instead — it stays visible for history but can no longer be edited
                or re-opened.
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
                {deleting?.status !== 'CLOSED' && (
                  <button
                    type="button"
                    onClick={handleCloseInstead}
                    disabled={deleteBusy}
                    className="btn-primary flex-1"
                  >
                    {deleteBusy ? 'Closing...' : 'Close Cycle Instead'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-secondary">
                Are you sure you want to delete{' '}
                <strong className="text-primary">{deleting?.name}</strong>? This will also remove
                all {deleting?._count.reviews ?? 0} auto-generated review row
                {deleting?._count.reviews === 1 ? '' : 's'} (none have been submitted yet). This
                action cannot be undone.
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
