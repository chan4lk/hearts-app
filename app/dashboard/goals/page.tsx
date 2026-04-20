'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Target } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import EmptyState2 from '@/app/components/shared/EmptyState2';
import GoalCard from '@/app/components/goals/GoalCard';
import GoalCreateModal from '@/app/components/goals/GoalCreateModal';
import GoalEditModal from '@/app/components/goals/GoalEditModal';
import GoalDeleteDialog from '@/app/components/goals/GoalDeleteDialog';
import GoalReviseModal from '@/app/components/goals/GoalReviseModal';
import type { Goal, FlashFn } from '@/app/components/goals/types';

const STATUS_TABS = ['ALL', 'DRAFT', 'PENDING', 'ACTIVE', 'NEEDS_REVISION', 'ON_HOLD', 'BLOCKED', 'COMPLETED', 'CLOSED'];
const TAB_LABELS: Record<string, string> = {
  ALL: 'All', DRAFT: 'Draft', PENDING: 'Pending', ACTIVE: 'Active',
  NEEDS_REVISION: 'Revision', ON_HOLD: 'On Hold', BLOCKED: 'Blocked',
  COMPLETED: 'Done', CLOSED: 'Closed',
};

export default function GoalsPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [reviseGoalId, setReviseGoalId] = useState<string | null>(null);

  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const flashMsg: FlashFn = useCallback((type, msg) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  }, []);

  const fetchGoals = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeTab !== 'ALL') params.set('status', activeTab);
    const res = await fetch(`/api/goals?${params}`);
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const isManager = session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN';
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleStatusChange = async (goalId: string, s: string) => {
    const endpoint = s === 'COMPLETED' ? `/api/goals/${goalId}/complete` : `/api/goals/${goalId}`;
    const method = s === 'COMPLETED' ? 'POST' : 'PATCH';
    const body = s === 'COMPLETED' ? '{}' : JSON.stringify({ status: s });
    const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body });
    if (res.ok) {
      flashMsg('success', `Goal moved to ${s.toLowerCase().replace('_', ' ')}`);
      await fetchGoals();
    } else {
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to update goal');
    }
  };

  const handleApprove = async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}/approve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    if (res.ok) {
      flashMsg('success', 'Goal approved');
      await fetchGoals();
    } else {
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to approve');
    }
  };

  const handleProgressPreview = (goalId: string, progress: number) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress } : g)));
  };

  const handleProgressCommit = async (goalId: string, progress: number) => {
    const res = await fetch(`/api/goals/${goalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      flashMsg('error', d.error || 'Failed to save progress');
    }
  };

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
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Goal
          </button>
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

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus-ring ${
                activeTab === tab
                  ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm'
                  : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : goals.length === 0 ? (
          <EmptyState2
            icon={Target}
            title="No goals yet"
            description="Set your first goal to start tracking progress"
            color="--color-goal-active"
          />
        ) : (
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                currentUserId={session?.user?.id}
                currentUserName={session?.user?.name ?? undefined}
                isManager={isManager}
                isAdmin={isAdmin}
                onStatusChange={handleStatusChange}
                onApprove={handleApprove}
                onRequestRevise={(goalId) => setReviseGoalId(goalId)}
                onProgressPreview={handleProgressPreview}
                onProgressCommit={handleProgressCommit}
                onEdit={setEditGoal}
                onDelete={setDeleteGoal}
              />
            ))}
          </div>
        )}
      </div>

      <HeartButton />

      <GoalCreateModal
        open={showCreate}
        isManager={isManager}
        onClose={() => setShowCreate(false)}
        onCreated={fetchGoals}
        flash={flashMsg}
      />

      <GoalEditModal
        goal={editGoal}
        onClose={() => setEditGoal(null)}
        onSaved={fetchGoals}
        flash={flashMsg}
      />

      <GoalDeleteDialog
        goal={deleteGoal}
        isAdmin={isAdmin}
        onClose={() => setDeleteGoal(null)}
        onDeleted={fetchGoals}
        flash={flashMsg}
      />

      <GoalReviseModal
        goalId={reviseGoalId}
        onClose={() => setReviseGoalId(null)}
        onRevised={fetchGoals}
        flash={flashMsg}
      />
    </DashboardLayout>
  );
}
