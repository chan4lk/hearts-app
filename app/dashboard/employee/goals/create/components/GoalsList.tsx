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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <BsListTask className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Created Goals</h2>
              <p className="text-gray-600 dark:text-gray-400">Goals you have created and submitted</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
              className="w-full sm:w-auto bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {filteredGoals.map(goal => (
              <motion.div
                key={goal.id}
                onClick={() => onViewGoal(goal)}
                className="group relative overflow-hidden bg-white/50 dark:bg-gray-700/50 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-600/50 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-xl ${
                    goal.status === 'APPROVED' 
                      ? 'bg-green-500/20 text-green-500' 
                      : goal.status === 'PENDING' 
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    <BsListTask className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-lg ${
                        goal.status === 'APPROVED' 
                          ? 'bg-green-500/10 text-green-500' 
                          : goal.status === 'PENDING' 
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {goal.status}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-500">
                        {goal.category}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-600/50 mb-4">
              <BsListTask className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No goals created yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Start creating and tracking your goals</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};