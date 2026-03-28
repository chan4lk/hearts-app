'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatusBadge from '@/app/components/goals/StatusBadge';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X, ChevronRight } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGoals = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeTab !== 'ALL') params.set('status', activeTab);
    const res = await fetch(`/api/goals?${params}`);
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch('/api/goals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description: description || undefined, targetDate: targetDate || undefined }) });
    if (res.ok) { setShowCreate(false); setTitle(''); setDescription(''); setTargetDate(''); await fetchGoals(); }
    setCreating(false);
  };

  const handleStatusChange = async (goalId: string, s: string) => { await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: s }) }); await fetchGoals(); };
  const handleProgressChange = async (goalId: string, p: number) => { await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: p }) }); };
  const handleApprove = async (goalId: string) => { await fetch(`/api/goals/${goalId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); await fetchGoals(); };
  const handleRevise = async (goalId: string) => { const c = prompt('What needs to change? (required)'); if (!c) return; await fetch(`/api/goals/${goalId}/revise`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: c }) }); await fetchGoals(); };

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
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 focus-ring shadow-sm">
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
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-surface-elevated rounded-2xl border border-theme animate-pulse" />)}</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-surface-elevated rounded-2xl border border-theme">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(var(--color-goal-active),0.1)' }}>
              <Target className="w-10 h-10" style={{ color: 'rgb(var(--color-goal-active))' }} />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No goals yet</h3>
            <p className="text-sm text-secondary">Set your first goal to start tracking progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-surface-elevated rounded-2xl border border-theme p-5 shadow-theme-sm hover:shadow-theme-md transition-all group">
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
                      <button onClick={() => handleRevise(goal.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-revision),0.1)] text-[rgb(var(--color-goal-revision))] hover:bg-[rgba(var(--color-goal-revision),0.2)] focus-ring">Revise</button></>)}
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface-elevated rounded-2xl border border-theme shadow-theme-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Target className="w-5 h-5" style={{ color: 'rgb(var(--color-goal-active))' }} /> New Goal</h2>
                  <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-primary focus-ring rounded-lg p-1"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div><label className="text-sm font-medium text-secondary mb-1.5 block">Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className="w-full px-3.5 py-2.5 bg-surface-primary border border-theme rounded-xl text-sm text-primary focus-ring" placeholder="What do you want to achieve?" /></div>
                  <div><label className="text-sm font-medium text-secondary mb-1.5 block">Description <span className="text-tertiary">(optional)</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} className="w-full px-3.5 py-2.5 bg-surface-primary border border-theme rounded-xl text-sm text-primary focus-ring resize-none" placeholder="How will you achieve it?" /></div>
                  <div><label className="text-sm font-medium text-secondary mb-1.5 block">Target Date <span className="text-tertiary">(optional)</span></label>
                    <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full px-3.5 py-2.5 bg-surface-primary border border-theme rounded-xl text-sm text-primary focus-ring" /></div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-secondary hover:text-primary focus-ring rounded-xl border border-theme">Cancel</button>
                    <button type="submit" disabled={creating || !title.trim()} className="flex-1 px-4 py-2.5 bg-accent text-[rgb(var(--color-text-inverse))] rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 focus-ring shadow-sm">{creating ? 'Creating...' : 'Create Goal'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}
