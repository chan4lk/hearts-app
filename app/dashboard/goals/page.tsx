'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Target, Search, User, X, Tag } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
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
  const [viewMode, setViewMode] = useState<'self' | 'assigned' | 'team'>('self');
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [templateCategories, setTemplateCategories] = useState<string[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [reviseGoalId, setReviseGoalId] = useState<string | null>(null);

  const [flash, setFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const flashMsg: FlashFn = useCallback((type, msg) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  }, []);

  const currentUserId = session?.user?.id;

  const fetchGoals = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeTab !== 'ALL') params.set('status', activeTab);
    // self / assigned tabs: narrow to own goals (ownerId = me) — client splits by assignerId
    // team tab: default API behavior (manager: own+reports; admin: all)
    if (viewMode !== 'team' && currentUserId) {
      params.set('ownerId', currentUserId);
    }
    const res = await fetch(`/api/goals?${params}`);
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, [activeTab, viewMode, currentUserId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    fetch('/api/goals/templates')
      .then((r) => (r.ok ? r.json() : []))
      .then((templates: { category: string | null }[]) => {
        const set = new Set<string>();
        for (const t of templates) if (t.category) set.add(t.category);
        setTemplateCategories(Array.from(set));
      })
      .catch(() => setTemplateCategories([]));
  }, []);

  const isManager = session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN';
  const isAdmin = session?.user?.role === 'ADMIN';

  const owners = useMemo(() => {
    const set = new Map<string, string>();
    for (const g of goals) set.set(g.owner.id, g.owner.name);
    return Array.from(set.values()).sort();
  }, [goals]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const g of goals) if (g.category) set.add(g.category);
    for (const c of templateCategories) set.add(c);
    return Array.from(set).sort();
  }, [goals, templateCategories]);

  const visibleGoals = useMemo(() => {
    const q = search.trim().toLowerCase();
    const o = ownerFilter.trim().toLowerCase();
    const c = categoryFilter.trim().toLowerCase();
    return goals.filter((g) => {
      // Tab scoping: self / assigned split by assignerId; team excludes own (manager).
      if (viewMode === 'self') {
        if (g.assignerId && g.assignerId !== g.ownerId) return false;
      } else if (viewMode === 'assigned') {
        if (!g.assignerId || g.assignerId === g.ownerId) return false;
      } else if (viewMode === 'team') {
        if (!isAdmin && g.ownerId === currentUserId) return false;
      }
      if (o && !g.owner.name.toLowerCase().includes(o)) return false;
      if (c) {
        const cat = (g.category ?? '').toLowerCase();
        if (!cat.includes(c)) return false;
      }
      if (q) {
        const hay = `${g.title} ${g.description ?? ''} ${g.owner.name} ${g.owner.department ?? ''} ${g.category ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [goals, search, ownerFilter, categoryFilter, viewMode, isAdmin, currentUserId]);

  const hasFilters = !!(search || ownerFilter || categoryFilter || activeTab !== 'ALL');

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
      <datalist id="goal-category-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <div className="max-w-4xl mx-auto space-y-6">
        <PageTitle
          title="Goals"
          subtitle="Track and manage your objectives"
          icon={Target}
          iconColor="--color-goal-active"
          actions={
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Goal
            </button>
          }
        />

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

        <div className="inline-flex gap-1 p-1 rounded-xl bg-surface-secondary w-fit">
          {(
            [
              { key: 'self', label: 'Self-Created' },
              { key: 'assigned', label: 'Assigned to Me' },
              ...(isManager
                ? ([{ key: 'team', label: isAdmin ? 'All Goals' : 'Team Goals' }] as const)
                : []),
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setViewMode(t.key);
                setOwnerFilter('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold focus-ring transition-all ${
                viewMode === t.key
                  ? 'bg-surface-elevated text-primary shadow-theme-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

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

        {!loading && goals.length > 0 && (
          <>
            <datalist id="goal-owner-options">
              {owners.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, description, owner..."
                  className="input-base pl-9"
                  aria-label="Search goals"
                />
              </div>
              {isManager && viewMode === 'team' && owners.length > 1 && (
                <div className="relative sm:w-48">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                  <input
                    type="text"
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    placeholder="All owners"
                    className="input-base pl-9 pr-8"
                    list="goal-owner-options"
                    autoComplete="off"
                    aria-label="Filter by owner (type to search)"
                  />
                  {ownerFilter && (
                    <button
                      type="button"
                      onClick={() => setOwnerFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                      aria-label="Clear owner filter"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              {categories.length > 0 && (
                <div className="relative sm:w-48">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                  <input
                    type="text"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    placeholder="All categories"
                    className="input-base pl-9 pr-8"
                    list="goal-category-options"
                    autoComplete="off"
                    aria-label="Filter by category (type to search)"
                  />
                  {categoryFilter && (
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                      aria-label="Clear category filter"
                      title="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-tertiary -mt-2">
              Showing {visibleGoals.length} of {goals.length} goal{goals.length === 1 ? '' : 's'}
              {activeTab !== 'ALL' && ` · status: ${TAB_LABELS[activeTab]}`}
              {hasFilters && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setOwnerFilter('');
                      setCategoryFilter('');
                      setActiveTab('ALL');
                    }}
                    className="text-accent hover:underline focus-ring rounded"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : visibleGoals.length === 0 ? (
          (() => {
            const rawEmpty = goals.length === 0;
            // If filters are trimming results but data exists, say so.
            if (!rawEmpty && hasFilters) {
              return (
                <div className="empty-container">
                  <div className="empty-icon-ring" style={{ backgroundColor: 'rgba(var(--color-goal-active),0.1)' }}>
                    <Target className="w-10 h-10" style={{ color: 'rgb(var(--color-goal-active))' }} />
                  </div>
                  <p className="empty-title">No goals match the current filters</p>
                  <p className="empty-description">Try a different search term, or clear filters to see all goals in this tab.</p>
                </div>
              );
            }
            // Tab-specific "nothing here yet" messages.
            let title = 'No goals yet';
            let description = 'Set your first goal to start tracking progress';
            if (viewMode === 'self') {
              title = 'No self-created goals yet';
              description = 'Click "New Goal" above to set a personal goal.';
            } else if (viewMode === 'assigned') {
              title = 'No goals assigned to you yet';
              description = isManager
                ? 'Nobody has pushed goals down to you. Use "Self-Created" to set your own.'
                : 'Your manager will assign goals here. Check back or create your own under "Self-Created".';
            } else if (viewMode === 'team') {
              title = isAdmin ? 'No goals in the system yet' : 'No team goals yet';
              description = isAdmin
                ? 'Once managers or employees create goals, they appear here.'
                : 'Assign goals to your direct reports from the Team page.';
            }
            return (
              <EmptyState2
                icon={Target}
                title={title}
                description={description}
                color="--color-goal-active"
              />
            );
          })()
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-hide pr-1 -mr-1">
            {visibleGoals.map((goal, i) => (
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
