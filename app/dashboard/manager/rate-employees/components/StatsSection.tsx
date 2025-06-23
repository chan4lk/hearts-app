import { motion } from "framer-motion";
import { BsGrid3X3, BsListUl, BsArrowUpRight } from "react-icons/bs";
import { GoalWithRating } from "../types";

interface StatsSectionProps {
  goals: GoalWithRating[];
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
}

export default function StatsSection({ goals, viewMode, setViewMode }: StatsSectionProps) {
  const ratedGoals = goals.filter(g => g.rating?.score).length;
  const averageRating = goals.length > 0
    ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
    : '0.0';
  const completionRate = goals.length > 0 
    ? Math.round((ratedGoals / goals.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl overflow-hidden"
      >
        <div className="relative backdrop-blur-sm border border-white/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl"></div>
          
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                    <span className="text-xs font-medium text-white">{i + 1}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-medium text-white">Performance Stats</div>
                <div className="text-xs text-indigo-200">Last 30 days activity</div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white/10 rounded-lg group hover:bg-white/20 transition-all"
            >
              <BsArrowUpRight className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
            </motion.button>
          </div>

          <div className="p-4 grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{goals.length}</div>
              <div className="text-xs text-indigo-200">Total Goals</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{completionRate}%</div>
              <div className="text-xs text-indigo-200">Completion</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl font-bold text-white">{averageRating}</div>
              <div className="text-xs text-indigo-200">Avg Rating</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* View Toggle Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400">View</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Display Mode</div>
              <div className="text-xs text-gray-500">Choose your preferred layout</div>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('list')}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              viewMode === 'list'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <BsListUl className="w-4 h-4" />
            <span className="text-sm font-medium">List</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewMode('grid')}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              viewMode === 'grid'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <BsGrid3X3 className="w-4 h-4" />
            <span className="text-sm font-medium">Grid</span>
          </motion.button>
          
        </div>
      </motion.div>
    </div>
  );
} 