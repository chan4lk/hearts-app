'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatusBadge from '@/app/components/goals/StatusBadge';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X, ChevronRight } from 'lucide-react';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import EmptyState2 from '@/app/components/shared/EmptyState2';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';

interface Goal {
  id: string; title: string; description: string | null; status: string; progress: number;
  targetDate: string | null; ownerId: string; assignerId: string | null;
  owner: { id: string; name: string; department: string | null };
  assigner: { id: string; name: string } | null;
  _count: { comments: number }; updatedAt: string;
}

const STATUS_TABS = ['ALL', 'DRAFT', 'PENDING', 'ACTIVE', 'NEEDS_REVISION', 'COMPLETED', 'CLOSED'];
const TAB_LABELS: Record<string, string> = { ALL: 'All', DRAFT: 'Draft', PENDING: 'Pending', ACTIVE: 'Active', NEEDS_REVISION: 'Revision', COMPLETED: 'Done', CLOSED: 'Closed' };

export default function GoalsPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; title: string; description: string | null; category: string | null }[]>([]);
  const [bulkGoals, setBulkGoals] = useState<{ title: string; description: string; targetDate: string }[]>([{ title: '', description: '', targetDate: '' }]);
  const [bulkMode, setBulkMode] = useState<'self' | 'assign'>('self');
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [reviseGoalId, setReviseGoalId] = useState<string | null>(null);
  const [reviseComment, setReviseComment] = useState('');

  const fetchGoals = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeTab !== 'ALL') params.set('status', activeTab);
    const res = await fetch(`/api/goals?${params}`);
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // Load templates and team when modal opens
  useEffect(() => {
    if (showCreate) {
      fetch('/api/goals/templates').then(r => r.ok ? r.json() : []).then(setTemplates);
      if (isManager) {
        fetch('/api/admin/users').then(r => r.ok ? r.json() : []).then((users: any[]) =>
          setTeamMembers(users.filter(u => u.role === 'EMPLOYEE'))
        );
      }
    }
  }, [showCreate]);

  const addGoalRow = () => setBulkGoals(prev => [...prev, { title: '', description: '', targetDate: '' }]);
  const removeGoalRow = (i: number) => setBulkGoals(prev => prev.filter((_, idx) => idx !== i));
  const updateGoalRow = (i: number, field: string, value: string) => setBulkGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));

  const applyTemplate = (i: number, templateId: string) => {
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setBulkGoals(prev => prev.map((g, idx) => idx === i ? { ...g, title: t.title, description: t.description || '' } : g));
    }
  };

  const toggleMember = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validGoals = bulkGoals.filter(g => g.title.trim());
    if (validGoals.length === 0) return;
    setCreating(true);

    const body: any = { goals: validGoals.map(g => ({ title: g.title, description: g.description || undefined, targetDate: g.targetDate || undefined })) };
    if (bulkMode === 'assign' && selectedMembers.length > 0) body.assignToUserIds = selectedMembers;

    const res = await fetch('/api/goals/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowCreate(false);
      setBulkGoals([{ title: '', description: '', targetDate: '' }]);
      setSelectedMembers([]);
      setBulkMode('self');
      await fetchGoals();
    }
    setCreating(false);
  };

  const resetAndOpenCreate = () => {
    setBulkGoals([{ title: '', description: '', targetDate: '' }]);
    setSelectedMembers([]);
    setBulkMode('self');
    setShowCreate(true);
  };

  const handleStatusChange = async (goalId: string, s: string) => { await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) }); await fetchGoals(); };
  const handleProgressChange = async (goalId: string, p: number) => { await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: p }) }); };
  const handleApprove = async (goalId: string) => { await fetch(`/api/goals/${goalId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); await fetchGoals(); };
  const handleRevise = async () => {
    if (!reviseGoalId || !reviseComment.trim()) return;
    await fetch(`/api/goals/${reviseGoalId}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: reviseComment }) });
    setReviseGoalId(null); setReviseComment('');
    await fetchGoals();
  };

  const isManager = session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN';

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Target className="w-6 h-6" style={{ color: 'rgb(var(--color-goal-active))' }} /> Goals
            </h1>
            <p className="text-sm text-secondary mt-0.5">Track and manage your objectives</p>
          </div>
          <button onClick={resetAndOpenCreate} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus-ring ${
                activeTab === tab ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm' : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
              }`}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : goals.length === 0 ? (
          <EmptyState2 icon={Target} title="No goals yet" description="Set your first goal to start tracking progress" color="--color-goal-active" />
        ) : (
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card-interactive p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Link href={`/dashboard/goals/${goal.id}`} className="text-sm font-semibold text-primary truncate hover:text-accent transition-colors">{goal.title}</Link>
                      <StatusBadge status={goal.status} />
                      <Link href={`/dashboard/goals/${goal.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="w-4 h-4 text-tertiary" /></Link>
                    </div>
                    {goal.description && <p className="text-xs text-secondary line-clamp-2 mb-2">{goal.description}</p>}
                    <div className="flex items-center gap-3 text-2xs text-tertiary">
                      {goal.owner.name !== session?.user?.name && <span>Owner: <strong className="text-secondary">{goal.owner.name}</strong></span>}
                      {goal.assigner && <span>By: <strong className="text-secondary">{goal.assigner.name}</strong></span>}
                      {goal.targetDate && <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>}
                      {goal._count.comments > 0 && <span>💬 {goal._count.comments}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {goal.status === 'DRAFT' && goal.ownerId === session?.user?.id && (
                      <button onClick={() => handleStatusChange(goal.id, 'PENDING')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-pending),0.1)] text-[rgb(var(--color-goal-pending))] hover:bg-[rgba(var(--color-goal-pending),0.2)] focus-ring">Submit</button>)}
                    {goal.status === 'NEEDS_REVISION' && goal.ownerId === session?.user?.id && (
                      <button onClick={() => handleStatusChange(goal.id, 'PENDING')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-revision),0.1)] text-[rgb(var(--color-goal-revision))] hover:bg-[rgba(var(--color-goal-revision),0.2)] focus-ring">Resubmit</button>)}
                    {goal.status === 'PENDING' && isManager && (<>
                      <button onClick={() => handleApprove(goal.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-completed),0.1)] text-[rgb(var(--color-goal-completed))] hover:bg-[rgba(var(--color-goal-completed),0.2)] focus-ring">Approve</button>
                      <button onClick={() => { setReviseGoalId(goal.id); setReviseComment(''); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-revision),0.1)] text-[rgb(var(--color-goal-revision))] hover:bg-[rgba(var(--color-goal-revision),0.2)] focus-ring">Revise</button></>)}
                    {goal.status === 'ACTIVE' && goal.ownerId === session?.user?.id && (
                      <button onClick={() => handleStatusChange(goal.id, 'COMPLETED')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-completed),0.1)] text-[rgb(var(--color-goal-completed))] hover:bg-[rgba(var(--color-goal-completed),0.2)] focus-ring">Complete</button>)}
                  </div>
                </div>
                {goal.status === 'ACTIVE' && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${goal.progress}%`, backgroundColor: 'rgb(var(--color-goal-active))' }} />
                    </div>
                    <input type="range" min="0" max="100" value={goal.progress}
                      onChange={(e) => setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, progress: parseInt(e.target.value) } : g))}
                      onMouseUp={(e) => handleProgressChange(goal.id, parseInt((e.target as HTMLInputElement).value))}
                      onTouchEnd={(e) => handleProgressChange(goal.id, parseInt((e.target as HTMLInputElement).value))}
                      className="w-16 accent-[rgb(var(--color-goal-active))]" aria-label={`Progress: ${goal.progress}%`} />
                    <span className="text-xs font-bold text-primary w-8 text-right">{goal.progress}%</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="modal-panel max-w-lg max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Target className="w-5 h-5" style={{ color: 'rgb(var(--color-goal-active))' }} />
                    {bulkMode === 'assign' ? 'Assign Goals to Team' : 'Create Goals'}
                  </h2>
                  <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-primary focus-ring rounded-lg p-1"><X className="w-5 h-5" /></button>
                </div>

                {/* Employee-only: simple goal creation (no team assign) */}

                <form onSubmit={handleCreate} className="space-y-4">
                  {/* Goal rows */}
                  {bulkGoals.map((goal, i) => (
                    <div key={i} className="p-4 bg-surface-secondary rounded-xl space-y-3 relative">
                      {bulkGoals.length > 1 && (
                        <button type="button" onClick={() => removeGoalRow(i)}
                          className="absolute top-2 right-2 text-tertiary hover:text-error focus-ring rounded p-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xs text-tertiary font-semibold">Goal {i + 1}</span>
                        {templates.length > 0 && (
                          <select onChange={(e) => { if (e.target.value) applyTemplate(i, e.target.value); e.target.value = ''; }}
                            className="text-2xs text-accent bg-transparent border border-theme rounded-lg px-2 py-1 cursor-pointer focus-ring" defaultValue="">
                            <option value="" disabled>📋 Use template...</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.category ? `[${t.category}] ` : ''}{t.title}</option>)}
                          </select>
                        )}
                      </div>
                      <input value={goal.title} onChange={(e) => updateGoalRow(i, 'title', e.target.value)}
                        required maxLength={200} className="input-base" placeholder="Goal title" />
                      <textarea value={goal.description} onChange={(e) => updateGoalRow(i, 'description', e.target.value)}
                        rows={2} maxLength={2000} className="input-textarea" placeholder="Description (optional)" />
                      <input type="date" value={goal.targetDate} onChange={(e) => updateGoalRow(i, 'targetDate', e.target.value)}
                        className="input-base" />
                    </div>
                  ))}

                  <button type="button" onClick={addGoalRow}
                    className="w-full py-2 border-2 border-dashed border-theme rounded-xl text-xs font-medium text-tertiary hover:text-primary hover:border-accent focus-ring transition-colors">
                    + Add Another Goal
                  </button>

                  {/* Team assign moved to Team page — this form is employee self-goals only */}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit"
                      disabled={creating || bulkGoals.every(g => !g.title.trim())}
                      className="btn-primary flex-1">
                      {creating ? 'Creating...' : `Create ${bulkGoals.filter(g => g.title.trim()).length} Goal(s)`}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <HeartButton />

      {/* Revision Comment Modal */}
      <Modal open={!!reviseGoalId} onClose={() => setReviseGoalId(null)} title="Request Revision"
        icon={<span className="text-[rgb(var(--color-goal-revision))]">↩</span>}>
        <form onSubmit={(e) => { e.preventDefault(); handleRevise(); }} className="space-y-4">
          <p className="text-sm text-secondary">Explain what needs to change so the employee can improve their goal.</p>
          <div>
            <label className="input-label">What needs to change? <span className="text-error">*</span></label>
            <textarea
              value={reviseComment}
              onChange={(e) => setReviseComment(e.target.value)}
              rows={4}
              className="input-textarea"
              placeholder="Be specific — e.g., 'The target date seems too aggressive, consider extending to end of quarter. Also add measurable success criteria.'"
              autoFocus
            />
          </div>
          <FormActions
            onCancel={() => setReviseGoalId(null)}
            submitLabel="Send Revision Request"
            disabled={!reviseComment.trim()}
          />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
