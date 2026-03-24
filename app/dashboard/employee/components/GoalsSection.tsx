'use client';

import { BsListUl, BsShield, BsStars } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { Pagination } from '@/app/components/shared/Pagination';
import { useState, useEffect } from 'react';

interface GoalsSectionProps {
  goals: Goal[];
  searchQuery: string;
  selectedStatus: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onGoalClick: (goal: Goal) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (goal: Goal) => void;
  onStatusUpdate?: (goalId: string, newStatus: string, updatedGoal: Goal) => void;
  userRole?: string;
  pagination?: {
    page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean;
  } | null;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

type ViewType = 'assigned' | 'created';

export default function GoalsSection({
  goals, searchQuery, selectedStatus, onSearchChange, onStatusChange,
  onGoalClick, onEditGoal, onDeleteGoal, onStatusUpdate, userRole,
  pagination, onPageChange, onLimitChange,
}: GoalsSectionProps) {
  const [activeView, setActiveView] = useState<ViewType>('created');

  const assignedGoals = goals.filter(g => g.manager && g.employee && g.manager.id !== g.employee.id);
  const selfCreatedGoals = goals.filter(g => g.employee && (!g.manager || g.manager.id === g.employee.id));

  useEffect(() => {
    if (activeView === 'assigned' && assignedGoals.length === 0 && selfCreatedGoals.length > 0) setActiveView('created');
  }, [activeView, assignedGoals.length, selfCreatedGoals.length]);

  const currentGoals = activeView === 'assigned' ? assignedGoals : selfCreatedGoals;
  const filteredGoals = currentGoals.filter(g =>
    (!selectedStatus || g.status === selectedStatus) &&
    (g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const Tab = ({ view, icon: Icon, label, shortLabel, count }: { view: ViewType; icon: any; label: string; shortLabel: string; count: number }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        activeView === view
          ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
          : 'text-secondary hover:text-primary hover:bg-surface-tertiary'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      <span className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${activeView === view ? 'bg-surface-tertiary' : 'bg-surface-secondary'}`}>{count}</span>
    </button>
  );

  return (
    <div className="bg-surface-elevated rounded-xl border border-theme overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-accent">
            <BsListUl className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Goals Overview</h2>
        </div>
        <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg">
          <Tab view="assigned" icon={BsShield} label="Assigned Goals" shortLabel="Assigned" count={assignedGoals.length} />
          <Tab view="created" icon={BsStars} label="My Growth Plan" shortLabel="Created" count={selfCreatedGoals.length} />
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        <GoalsTable
          goals={filteredGoals}
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          onSearchChange={onSearchChange}
          onStatusChange={onStatusChange}
          onGoalClick={onGoalClick}
          onEdit={activeView === 'created' ? onEditGoal : undefined}
          onDelete={activeView === 'created' ? onDeleteGoal : undefined}
          onStatusUpdate={onStatusUpdate}
          showActions={false}
        />
        {pagination && onPageChange && onLimitChange && (
          <div className="mt-4 pt-3 border-t border-theme">
            <Pagination
              page={pagination.page} limit={pagination.limit} total={pagination.total}
              totalPages={pagination.totalPages} hasNext={pagination.hasNext} hasPrev={pagination.hasPrev}
              onPageChange={onPageChange} onLimitChange={onLimitChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
