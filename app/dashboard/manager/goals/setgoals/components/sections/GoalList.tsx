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
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2.5 rounded-xl shadow-inner">
              <BsBriefcase className="w-5 h-5 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Goals
              <span className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-sm">
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
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="ml-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 hover:text-white transition-all text-xs font-medium"
                title="Refresh"
                disabled={refreshing}
              >
                <motion.span
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.2 }}
                  style={{ display: 'inline-block' }}
                >
                  &#x21bb;
                </motion.span>
                {refreshing ? ' Refreshing...' : ' Refresh'}
              </button>
            )}
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