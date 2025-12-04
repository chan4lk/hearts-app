import { motion } from 'framer-motion';
import { BsListTask, BsArrowRepeat } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { useSession } from 'next-auth/react';
import GoalsTable from '@/app/components/shared/GoalsTable';

interface GoalsListProps {
  goals: Goal[];
  selectedStatus: string;
  selectedCategory: string;
  setSelectedStatus: (status: string) => void;
  setSelectedCategory: (category: string) => void;
  onViewGoal: (goal: Goal) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export const GoalsList = ({
  goals,
  selectedStatus,
  selectedCategory,
  setSelectedStatus,
  setSelectedCategory,
  onViewGoal,
  onRefresh,
  refreshing = false,
}: GoalsListProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Only show goals created by the current user
  const userCreatedGoals = goals.filter(goal => goal.createdBy?.id === userId);

  const filteredGoals = userCreatedGoals.filter(goal => {
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    return matchesStatus && matchesCategory;
  });

  return (
    <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50"></div>
      
      <div className="relative p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg backdrop-blur-sm">
              <BsListTask className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white/90">My Created Goals</h2>
              <p className="text-xs text-gray-400">Goals you have created and submitted</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all text-xs font-medium flex items-center gap-2"
            title="Refresh"
            disabled={refreshing}
          >
            <motion.span
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.2 }}
              style={{ display: 'inline-block' }}
            >
              <BsArrowRepeat className="w-4 h-4" />
            </motion.span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Goals Table */}
        <div className="mt-6">
          <GoalsTable
            goals={filteredGoals}
            selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
            onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
            onGoalClick={onViewGoal}
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};
