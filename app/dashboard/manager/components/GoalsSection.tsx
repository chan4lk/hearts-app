import { BsListUl, BsShield, BsStars } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { Pagination } from '@/app/components/shared/Pagination';
import { useState } from 'react';

interface GoalsSectionProps {
  goals: Goal[];
  selectedStatus: string;
  selectedEmployee: string;
  selectedPriority: string;
  onGoalClick: (goal: Goal) => void;
  onStatusUpdate?: (goalId: string, newStatus: string, updatedGoal: Goal) => void;
  onPriorityUpdate?: (goalId: string, newPriority: string, updatedGoal: Goal) => void;
  onDueDateUpdate?: (goalId: string, newDueDate: string, updatedGoal: Goal) => void;
  canEditPriority?: (goal: Goal) => boolean;
  canEditDueDate?: (goal: Goal) => boolean;
  allowedStatuses?: (goal: Goal) => string[];
  isAssignedGoal: (goal: Goal) => boolean;
  isSelfCreatedGoal: (goal: Goal) => boolean;
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

type ViewType = 'assigned' | 'self-created';

export default function GoalsSection({
  goals,
  selectedStatus,
  selectedEmployee,
  selectedPriority,
  onGoalClick,
  onStatusUpdate,
  onPriorityUpdate,
  onDueDateUpdate,
  canEditPriority,
  canEditDueDate,
  allowedStatuses,
  isAssignedGoal,
  isSelfCreatedGoal,
  pagination,
  onPageChange,
  onLimitChange,
}: GoalsSectionProps) {
  const [activeView, setActiveView] = useState<ViewType>('assigned');

  // Separate assigned and self-created goals
  const assignedGoals = goals.filter(goal => isAssignedGoal(goal));
  const selfCreatedGoals = goals.filter(goal => isSelfCreatedGoal(goal));

  // Filter goals based on selected filters
  const filterGoals = (goalList: Goal[]) => {
    return goalList.filter(goal => {
      if (!goal.employee) return false;
      const matchesStatus = !selectedStatus || goal.status === selectedStatus;
      const matchesEmployee = selectedEmployee === 'all' || goal.employee.email === selectedEmployee;
      const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
      return matchesStatus && matchesEmployee && matchesPriority;
    });
  };

  const filteredAssignedGoals = filterGoals(assignedGoals);
  const filteredSelfCreatedGoals = filterGoals(selfCreatedGoals);
  const currentGoals = activeView === 'assigned' ? filteredAssignedGoals : filteredSelfCreatedGoals;
  
  // Use filtered counts for badges to match what's displayed in the table
  const assignedGoalsCount = filteredAssignedGoals.length;
  const selfCreatedGoalsCount = filteredSelfCreatedGoals.length;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-theme overflow-hidden shadow-lg">
      <div className="p-4">
        {/* Header Section */}
        <div className="px-4 py-3 border-b border-theme mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg backdrop-blur-sm">
                <BsListUl className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goals Overview</h2>
            </div>

            {/* View Toggle Buttons */}
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
                <span className="hidden sm:inline">Assigned Goals to Employees</span>
                <span className="sm:hidden">Assigned</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {assignedGoalsCount}
                </span>
              </button>
              <button
                onClick={() => setActiveView('self-created')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeView === 'self-created'
                    ? 'bg-purple-500 text-white'
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                }`}
              >
                <BsStars className="w-4 h-4" />
                <span className="hidden sm:inline">Employees Self Created Goals</span>
                <span className="sm:hidden">Self-Created</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {selfCreatedGoalsCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Goals Table */}
        <div className="mt-6">
          <GoalsTable
            goals={currentGoals}
            onGoalClick={onGoalClick}
            showEmployee={true}
            showManager={false}
            showActions={false}
            onStatusUpdate={onStatusUpdate}
            onPriorityUpdate={onPriorityUpdate}
            onDueDateUpdate={onDueDateUpdate}
            canEditPriority={canEditPriority}
            canEditDueDate={canEditDueDate}
            allowedStatuses={allowedStatuses}
          />
          
          {/* Pagination */}
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

