import { motion } from 'framer-motion';
import React from 'react';
import { BsBriefcase } from 'react-icons/bs';
import { Goal, User } from '@/app/components/shared/types';
import { EmployeeFilter } from './EmployeeFilter';
import GoalsTable from '@/app/components/shared/GoalsTable';

interface GoalListProps {
  goals: Goal[];
  assignedEmployees: User[];
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  onViewGoal: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};


export function GoalList({ 
  goals, 
  assignedEmployees, 
  selectedEmployee, 
  onEmployeeChange,
  onViewGoal,
  onEditGoal,
  onDeleteGoal,
  onRefresh, // <-- add this
  refreshing = false, // <-- add this
}: GoalListProps) {
  const filteredGoals = selectedEmployee === 'all' 
    ? goals 
    : goals.filter(goal => goal.employee?.id === selectedEmployee);

  return (
    <motion.div variants={itemVariants}>
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Goals
              <span className="bg-indigo-500/10 text-indigo-400 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-sm">
                {filteredGoals.length}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <EmployeeFilter
              selectedEmployee={selectedEmployee}
              onEmployeeChange={onEmployeeChange}
              assignedEmployees={assignedEmployees}
            />
          </div>
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