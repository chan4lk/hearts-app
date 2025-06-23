import { motion } from 'framer-motion';
import { BsPlus, BsPersonWorkspace } from 'react-icons/bs';

interface HeroSectionProps {
  onCreateClick: () => void;
  totalGoals: number;
  completedGoals: number;
}

export const HeroSection = ({ onCreateClick, totalGoals, completedGoals }: HeroSectionProps) => {
  const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="relative">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-purple-50/30 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-lg" />

      <div className="relative px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600"
            >
              <BsPersonWorkspace className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-base sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400"
              >
                Self-Development Goals
              </motion.h1>
              <motion.p
                initial={{ y: -5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 max-w-[200px] sm:max-w-none"
              >
                Define your personal objectives and growth targets
              </motion.p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateClick}
            className="flex items-center justify-center xs:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm hover:shadow transition-all duration-200 border border-indigo-100 dark:border-indigo-800 w-full xs:w-auto"
          >
            <span className="text-xs sm:text-sm font-medium">Add Goal</span>
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-indigo-50 dark:bg-indigo-900/30">
              <BsPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}; 