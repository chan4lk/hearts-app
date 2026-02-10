'use client';

import { motion } from 'framer-motion';
import { Goal } from '@/app/components/shared/types';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { Pagination } from '@/app/components/shared/Pagination';
import GoalListWithTable, { paginationBorderClass } from '@/app/components/shared/GoalListWithTable';

interface GoalListProps {
  goals: Goal[];
  selectedEmployee: string;
  selectedStatus?: string;
  selectedPriority?: string;
  onViewGoal: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onPriorityUpdate?: (goalId: string, newPriority: string, updatedGoal: Goal) => void;
  onDueDateUpdate?: (goalId: string, newDueDate: string, updatedGoal: Goal) => void;
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function GoalList({
  goals,
  onViewGoal,
  onEditGoal,
  onDeleteGoal,
  onPriorityUpdate,
  onDueDateUpdate,
  pagination,
  onPageChange,
  onLimitChange,
}: GoalListProps) {
  return (
    <motion.div variants={itemVariants}>
      <GoalListWithTable>
        <GoalsTable
          goals={goals}
          onGoalClick={onViewGoal}
          showEmployee
          showManager={false}
          disableStatusUpdate
          onPriorityUpdate={onPriorityUpdate}
          onDueDateUpdate={onDueDateUpdate}
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
      </GoalListWithTable>
    </motion.div>
  );
}
