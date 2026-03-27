'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import StatusBadge from '@/app/components/goals/StatusBadge';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, X } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  targetDate: string | null;
  ownerId: string;
  assignerId: string | null;
  owner: { id: string; name: string; department: string | null };
  assigner: { id: string; name: true } | null;
  _count: { comments: number };
  updatedAt: string;
}

const STATUS_TABS = ['ALL', 'DRAFT', 'PENDING', 'ACTIVE', 'NEEDS_REVISION', 'COMPLETED', 'CLOSED'];

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
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || undefined, targetDate: targetDate || undefined }),
    });
    if (res.ok) {
      setShowCreate(false);
      setTitle(''); setDescription(''); setTargetDate('');
      await fetchGoals();
    }
    setCreating(false);
  };

  const handleStatusChange = async (goalId: string, newStatus: string) => {
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchGoals();
  };

  const handleProgressChange = async (goalId: string, progress: number) => {
    await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
  };

  const handleApprove = async (goalId: string) => {
    await fetch(`/api/goals/${goalId}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    await fetchGoals();
  };

  const handleRevise = async (goalId: string) => {
    const comment = prompt('What needs to change? (required)');
    if (!comment) return;
    await fetch(`/api/goals/${goalId}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
    await fetchGoals();
  };

  const userRole = session?.user?.role;
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Goals" description="Track and manage your objectives">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 focus-ring"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </PageHeader>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-ring ${
                activeTab === tab ? 'bg-accent text-[rgb(var(--color-text-inverse))]' : 'bg-surface-secondary text-secondary hover:text-primary'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'NEEDS_REVISION' ? 'Needs Revision' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Goals list */}
        {loading ? (
          <div className="text-center py-12 text-secondary">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <Target className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No goals yet</h3>
            <p className="text-sm text-secondary">Set your first goal to start tracking progress</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/dashboard/goals/${goal.id}`} className="text-sm font-semibold text-primary truncate hover:text-accent transition-colors">
                        {goal.title}
                      </Link>
                      <StatusBadge status={goal.status} />
                    </div>
                    {goal.description && <p className="text-xs text-secondary line-clamp-2 mb-2">{goal.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-tertiary">
                      {goal.owner.name !== session?.user?.name && <span>Owner: {goal.owner.name}</span>}
                      {goal.assigner && <span>Assigned by: {goal.assigner.name}</span>}
                      {goal.targetDate && <span>Due: {new Date(goal.targetDate).toLocaleDateString()}</span>}
                      {goal._count.comments > 0 && <span>{goal._count.comments} comments</span>}
                    </div>
                  </div>

                  {/* Actions based on status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {goal.status === 'DRAFT' && goal.ownerId === session?.user?.id && (
                      <button onClick={() => handleStatusChange(goal.id, 'PENDING')} className="text-xs font-medium text-accent hover:opacity-80 focus-ring rounded px-2 py-1">
                        Submit
                      </button>
                    )}
                    {goal.status === 'NEEDS_REVISION' && goal.ownerId === session?.user?.id && (
                      <button onClick={() => handleStatusChange(goal.id, 'PENDING')} className="text-xs font-medium text-accent hover:opacity-80 focus-ring rounded px-2 py-1">
                        Resubmit
                      </button>
                    )}
                    {goal.status === 'PENDING' && isManager && (
                      <>
                        <button onClick={() => handleApprove(goal.id)} className="text-xs font-medium text-success hover:opacity-80 focus-ring rounded px-2 py-1">
                          Approve
                        </button>
                        <button onClick={() => handleRevise(goal.id)} className="text-xs font-medium text-warning hover:opacity-80 focus-ring rounded px-2 py-1">
                          Revise
                        </button>
                      </>
                    )}
                    {goal.status === 'ACTIVE' && goal.ownerId === session?.user?.id && (
                      <button onClick={() => handleStatusChange(goal.id, 'COMPLETED')} className="text-xs font-medium text-success hover:opacity-80 focus-ring rounded px-2 py-1">
                        Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar for active goals */}
                {goal.status === 'ACTIVE' && (
                  <div className="mt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <input
                        type="range"
                        min="0" max="100"
                        value={goal.progress}
                        onChange={(e) => {
                          const newProgress = parseInt(e.target.value);
                          setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, progress: newProgress } : g));
                        }}
                        onMouseUp={(e) => handleProgressChange(goal.id, parseInt((e.target as HTMLInputElement).value))}
                        onTouchEnd={(e) => handleProgressChange(goal.id, parseInt((e.target as HTMLInputElement).value))}
                        className="w-20 accent-[rgb(var(--color-accent))]"
                        aria-label={`Goal progress: ${goal.progress}%`}
                      />
                      <span className="text-xs font-bold text-primary w-8 text-right">{goal.progress}%</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Goal Modal */}
        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface-elevated rounded-xl border border-theme shadow-theme-xl p-6 w-full max-w-md"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-primary">New Goal</h2>
                  <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-primary focus-ring rounded p-1"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200}
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" placeholder="What do you want to achieve?" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Description (optional)</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000}
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring resize-none" placeholder="How will you achieve it?" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Target Date (optional)</label>
                    <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm text-secondary hover:text-primary focus-ring rounded-lg">Cancel</button>
                    <button type="submit" disabled={creating || !title.trim()}
                      className="flex-1 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 focus-ring">
                      {creating ? 'Creating...' : 'Create Goal'}
                    </button>
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
