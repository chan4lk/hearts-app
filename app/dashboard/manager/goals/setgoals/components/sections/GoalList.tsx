import { motion } from 'framer-motion';
import React from 'react';
import { Goal } from '@/app/components/shared/types';
import GoalsTable from '@/app/components/shared/GoalsTable';

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
}: GoalListProps) {
  const filteredGoals = goals.filter(goal => {
    const matchesEmployee = selectedEmployee === 'all' || goal.employee?.id === selectedEmployee;
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
    return matchesEmployee && matchesStatus && matchesPriority;
  });

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
        </div>
      </div>
    </motion.div>
  );
} 