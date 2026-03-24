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
  pagination?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean } | null;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

type ViewType = 'assigned' | 'self-created';

export default function GoalsSection({
  goals, selectedStatus, selectedEmployee, selectedPriority, onGoalClick,
  onStatusUpdate, onPriorityUpdate, onDueDateUpdate, canEditPriority, canEditDueDate,
  allowedStatuses, isAssignedGoal, isSelfCreatedGoal, pagination, onPageChange, onLimitChange,
}: GoalsSectionProps) {
  const [activeView, setActiveView] = useState<ViewType>('assigned');

  const assignedGoals = goals.filter(g => isAssignedGoal(g));
  const selfCreatedGoals = goals.filter(g => isSelfCreatedGoal(g));

  const filterGoals = (list: Goal[]) => list.filter(g => {
    if (!g.employee) return false;
    return (!selectedStatus || g.status === selectedStatus) &&
      (selectedEmployee === 'all' || g.employee.email === selectedEmployee) &&
      (!selectedPriority || g.priority === selectedPriority);
  });

  const filteredAssigned = filterGoals(assignedGoals);
  const filteredSelfCreated = filterGoals(selfCreatedGoals);
  const currentGoals = activeView === 'assigned' ? filteredAssigned : filteredSelfCreated;

  const Tab = ({ view, icon: Icon, label, shortLabel, count }: { view: ViewType; icon: any; label: string; shortLabel: string; count: number }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
        activeView === view
          ? 'bg-indigo-600 text-white'
          : 'text-secondary hover:text-primary hover:bg-surface-tertiary'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      <span className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${activeView === view ? 'bg-white/20' : 'bg-surface-secondary'}`}>{count}</span>
    </button>
  );

  return (
    <div className="bg-surface-elevated rounded-xl border border-theme overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-accent">
            <BsListUl className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-primary">Goals Overview</h2>
        </div>
        <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg">
          <Tab view="assigned" icon={BsShield} label="Assigned to Employees" shortLabel="Assigned" count={filteredAssigned.length} />
          <Tab view="self-created" icon={BsStars} label="Self Created Goals" shortLabel="Self-Created" count={filteredSelfCreated.length} />
        </div>
      </div>

      <div className="p-4">
        <GoalsTable
          goals={currentGoals} onGoalClick={onGoalClick} showEmployee={true} showManager={false}
          showActions={false} onStatusUpdate={onStatusUpdate} onPriorityUpdate={onPriorityUpdate}
          onDueDateUpdate={onDueDateUpdate} canEditPriority={canEditPriority}
          canEditDueDate={canEditDueDate} allowedStatuses={allowedStatuses}
        />
        {pagination && onPageChange && onLimitChange && (
          <div className="mt-4 pt-3 border-t border-theme">
            <Pagination page={pagination.page} limit={pagination.limit} total={pagination.total}
              totalPages={pagination.totalPages} hasNext={pagination.hasNext} hasPrev={pagination.hasPrev}
              onPageChange={onPageChange} onLimitChange={onLimitChange} />
          </div>
        )}
      </div>
    </div>
  );
}
