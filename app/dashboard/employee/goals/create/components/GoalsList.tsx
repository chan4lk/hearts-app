import { motion } from 'framer-motion';
import { BsListTask } from 'react-icons/bs';
import { Goal } from '../types';
import { CATEGORIES, STATUSES } from '../constants';
import { useSession } from 'next-auth/react';

interface GoalsListProps {
  goals: Goal[];
  selectedStatus: string;
  selectedCategory: string;
  setSelectedStatus: (status: string) => void;
  setSelectedCategory: (category: string) => void;
  onViewGoal: (goal: Goal) => void;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return {
        bg: 'bg-emerald-500/20 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-300',
        badge: 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
      };
    case 'PENDING':
      return {
        bg: 'bg-amber-500/20 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        icon: 'bg-amber-500/30 text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-100 dark:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
      };
    case 'REJECTED':
      return {
        bg: 'bg-rose-500/20 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-300',
        icon: 'bg-rose-500/30 text-rose-700 dark:text-rose-300',
        badge: 'bg-rose-100 dark:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
      };
    default:
      return {
        bg: 'bg-slate-500/20 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        icon: 'bg-slate-500/30 text-slate-700 dark:text-slate-300',
        badge: 'bg-slate-100 dark:bg-slate-500/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-500/30'
      };
  }
};

export const GoalsList = ({
  goals,
  selectedStatus,
  selectedCategory,
  setSelectedStatus,
  setSelectedCategory,
  onViewGoal,
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
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="w-full">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl">
              <BsListTask className="text-xl sm:text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">My Created Goals</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Goals you have created and submitted</p>
            </div>
          </div>
          <div className="flex flex-col xs:flex-row gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full xs:w-auto text-xs sm:text-sm bg-gray-800  backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            >
              {STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full xs:w-auto text-xs sm:text-sm bg-gray-800 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {goals.length > 0 ? (
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
          >
            {filteredGoals.map(goal => {
              const statusStyles = getStatusStyles(goal.status);
              return (
                <motion.div
                  key={goal.id}
                  onClick={() => onViewGoal(goal)}
                  className={`group relative overflow-hidden ${statusStyles.bg} backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/20 dark:border-gray-600/50 p-3 sm:p-4 hover:shadow-lg transition-all duration-300 cursor-pointer`}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${statusStyles.icon}`}>
                      <BsListTask className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base sm:text-lg font-semibold mb-1 line-clamp-1 ${statusStyles.text}`}>
                        {goal.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {goal.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        <span className={`px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg ${statusStyles.badge}`}>
                          {goal.status}
                        </span>
                        <span className="px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-purple-100 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                          {goal.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-3 sm:mb-4">
              <BsListTask className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1.5 sm:mb-2">No goals created yet</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">Start creating and tracking your goals</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};