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
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

type ViewType = 'assigned' | 'created';

export default function GoalsSection({
  goals,
  searchQuery,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onGoalClick,
  onEditGoal,
  onDeleteGoal,
  onStatusUpdate,
  userRole,
  pagination,
  onPageChange,
  onLimitChange,
}: GoalsSectionProps) {
  const [activeView, setActiveView] = useState<ViewType>('created');

  const assignedGoals = goals.filter(
    (goal) =>
      goal.manager &&
      goal.employee &&
      goal.manager.id !== goal.employee.id
  );
  const selfCreatedGoals = goals.filter(
    (goal) =>
      goal.employee &&
      (!goal.manager || goal.manager.id === goal.employee.id)
  );

  useEffect(() => {
    if (activeView === 'assigned' && assignedGoals.length === 0 && selfCreatedGoals.length > 0) {
      setActiveView('created');
    }
  }, [activeView, assignedGoals.length, selfCreatedGoals.length]);

  const currentGoals = activeView === 'assigned' ? assignedGoals : selfCreatedGoals;
  const filteredGoals = currentGoals.filter(
    (goal) =>
      (!selectedStatus || goal.status === selectedStatus) &&
      (goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-theme overflow-hidden shadow-lg">
      <div className="p-4">
        <div className="px-4 py-3 border-b border-theme mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg backdrop-blur-sm">
                <BsListUl className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goals Overview</h2>
            </div>
            <div className="flex gap-2 p-1 bg-surface-secondary rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setActiveView('assigned')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeView === 'assigned'
                    ? 'bg-indigo-500 text-white'
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                }`}
              >
                <BsShield className="w-4 h-4" />
                <span className="hidden sm:inline">My Assigned Goals</span>
                <span className="sm:hidden">Assigned</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {assignedGoals.length}
                </span>
              </button>
              <button
                onClick={() => setActiveView('created')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeView === 'created'
                    ? 'bg-purple-500 text-white'
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                }`}
              >
                <BsStars className="w-4 h-4" />
                <span className="hidden sm:inline">My Growth Plan</span>
                <span className="sm:hidden">Created</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {selfCreatedGoals.length}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6">
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
            <div className="mt-6 pt-4 border-t border-theme">
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
