'use client';

import { Goal } from '@/app/components/shared/types';
import { useSession } from 'next-auth/react';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { Pagination } from '@/app/components/shared/Pagination';
import GoalListWithTable, { paginationBorderClass } from '@/app/components/shared/GoalListWithTable';

interface GoalsListProps {
  goals: Goal[];
  selectedStatus: string;
  selectedCategory: string;
  selectedPriority?: string;
  setSelectedStatus: (status: string) => void;
  setSelectedCategory: (category: string) => void;
  onViewGoal: (goal: Goal) => void;
  onRefresh: () => void;
  refreshing?: boolean;
  onPriorityUpdate?: (goalId: string, newPriority: string, updatedGoal: Goal) => void;
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

export function GoalsList({
  goals,
  selectedStatus,
  selectedCategory,
  selectedPriority = '',
  setSelectedStatus,
  setSelectedCategory,
  onViewGoal,
  onRefresh,
  refreshing = false,
  onPriorityUpdate,
  pagination,
  onPageChange,
  onLimitChange,
}: GoalsListProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const userGoals = goals.filter((goal) => goal.employeeId === userId);
  const filteredGoals = userGoals.filter((goal) => {
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
    return matchesStatus && matchesCategory && matchesPriority;
  });

  return (
    <GoalListWithTable>
      <div className="mt-6">
        <GoalsTable
          goals={filteredGoals}
          selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
          onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
          onGoalClick={onViewGoal}
          showActions={false}
          onPriorityUpdate={onPriorityUpdate}
        />
        {pagination && onPageChange && onLimitChange && (
          <div className={paginationBorderClass}>
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
    </GoalListWithTable>
  );
}
