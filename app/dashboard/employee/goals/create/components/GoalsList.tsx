import { motion } from 'framer-motion';
import { BsListTask, BsFilter, BsCalendar } from 'react-icons/bs';
import { Goal } from '../types';
import { CATEGORIES } from '@/app/components/shared/constants';
import { useSession } from 'next-auth/react';

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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

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
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4 shadow-inner">
              <BsListTask className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No goals created yet</h3>
            <p className="text-base text-white/70">Start creating and tracking your goals</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
          >
            {filteredGoals.map(goal => {
              const categoryConfig = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
              return (
                <motion.button
                  key={goal.id}
                  variants={itemVariants}
                  onClick={() => onViewGoal(goal)}
                  className="group relative overflow-hidden w-full text-left h-[200px]"
                >
                  <div className={`relative h-full p-4 rounded-xl backdrop-blur-xl border border-white/10 transition-all duration-300
                    ${categoryConfig.bgColor} ${categoryConfig.bgGradient}
                    hover:shadow-2xl hover:shadow-purple-500/10`}
                  >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
                    
                    <div className="relative h-full flex flex-col">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl
                          ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                          group-hover:scale-110 group-hover:rotate-[10deg] flex-shrink-0`}>
                          <categoryConfig.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-white group-hover:text-transparent 
                            group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                            transition-all duration-300 truncate">{goal.title}</h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

                      {/* Footer */}
                      <div className="flex flex-col gap-2 mt-2">
                        {/* Due Date */}
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                          <BsCalendar className="w-3 h-3" />
                          <span>Due: {new Date(goal.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>

                        {/* Status Tags */}
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r 
                            ${goal.status === 'APPROVED' ? 'from-emerald-500/10 to-emerald-500/20 text-emerald-300' :
                            goal.status === 'PENDING' ? 'from-amber-500/10 to-amber-500/20 text-amber-300' :
                            goal.status === 'REJECTED' ? 'from-red-500/10 to-red-500/20 text-red-300' :
                            'from-gray-500/10 to-gray-500/20 text-gray-300'}`}>
                            {goal.status}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500/10 to-purple-500/20 text-purple-300">
                            {goal.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effects */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                      bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};