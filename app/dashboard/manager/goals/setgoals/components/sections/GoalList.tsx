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
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Goals
            <span className="bg-indigo-500/10 text-indigo-400 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-sm">
              {filteredGoals.length}
            </span>
          </h3>
        </div>

        <div className="p-4">
          <GoalsTable
            goals={filteredGoals}
            onGoalClick={onViewGoal}
            showEmployee={true}
            showManager={true}
            disableStatusUpdate={true}
          />
        </div>
      </div>
    </motion.div>
  );
} 