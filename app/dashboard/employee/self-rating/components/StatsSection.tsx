import { motion } from "framer-motion";
import { BsClipboardData, BsCheckCircle, BsBarChart } from "react-icons/bs";
import { Stats } from "@/app/components/shared/types";

interface StatsSectionProps {
  stats: Stats;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300 opacity-75" />
        <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 flex items-center gap-4 border border-blue-100/50 dark:border-blue-900/50">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
            <BsClipboardData className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Goals</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300 opacity-75" />
        <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 flex items-center gap-4 border border-green-100/50 dark:border-green-900/50">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white">
            <BsCheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rated Goals</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rated}</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-300 opacity-75" />
        <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 flex items-center gap-4 border border-yellow-100/50 dark:border-yellow-900/50">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg text-white">
            <BsBarChart className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.average}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 