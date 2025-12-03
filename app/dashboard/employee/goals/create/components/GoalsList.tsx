import { motion } from 'framer-motion';
import { BsListTask, BsFilter, BsArrowRepeat } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { CATEGORIES } from '@/app/components/shared/constants';
import { useSession } from 'next-auth/react';
import GoalsTable from '@/app/components/shared/GoalsTable';

const STATUSES = [
  { value: 'all', label: 'All Goals' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DRAFT', label: 'Draft' }
] as const;

interface GoalsListProps {
  goals: Goal[];
  selectedStatus: string;
  selectedCategory: string;
  setSelectedStatus: (status: string) => void;
  setSelectedCategory: (category: string) => void;
  onViewGoal: (goal: Goal) => void;
  onRefresh: () => void;
  refreshing?: boolean; // Add refreshing prop
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

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
    <motion.div variants={itemVariants}>
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2.5 rounded-xl shadow-inner">
              <BsListTask className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                My Created Goals
                <span className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-sm">
                  {filteredGoals.length}
                </span>
              </h3>
              <p className="text-sm text-gray-400">Goals you have created and submitted</p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 outline-none backdrop-blur-xl"
              >
                {STATUSES.map(status => (
                  <option key={status.value} value={status.value} className="bg-gray-800">
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/5 text-white border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 outline-none backdrop-blur-xl"
              >
                <option value="all" className="bg-gray-800">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value} className="bg-gray-800">
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
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
          </div>
        </div>

        <div className="p-4">
          <GoalsTable
            goals={filteredGoals}
            selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
            onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
            onGoalClick={onViewGoal}
          />
        </div>
      </div>
    </motion.div>
  );
};