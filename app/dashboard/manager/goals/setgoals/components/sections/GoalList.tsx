import { motion } from 'framer-motion';
import React from 'react';
import { Goal } from '@/app/components/shared/types';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { Pagination } from '@/app/components/shared/Pagination';

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
  visible: { opacity: 1, y: 0 }
};


export function GoalList({ 
  goals, 
  selectedEmployee,
  selectedStatus = '',
  selectedPriority = '',
  onViewGoal,
  onEditGoal,
  onDeleteGoal,
  onPriorityUpdate,
  onDueDateUpdate,
  pagination,
  onPageChange,
  onLimitChange,
}: GoalListProps) {
  // Server-side filtering is done, but we keep client-side filtering for view switching if needed
  const filteredGoals = goals;

  return (
    <motion.div variants={itemVariants}>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden shadow-lg">
        <div className="p-4">
          <GoalsTable
            goals={filteredGoals}
            onGoalClick={onViewGoal}
            showEmployee={true}
            showManager={false}
            disableStatusUpdate={true}
            onPriorityUpdate={onPriorityUpdate}
            onDueDateUpdate={onDueDateUpdate}
          />
          
          {/* Pagination */}
          {pagination && onPageChange && onLimitChange && (
            <div className="mt-6 pt-4 border-t border-gray-700/50">
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
    </motion.div>
  );
} 