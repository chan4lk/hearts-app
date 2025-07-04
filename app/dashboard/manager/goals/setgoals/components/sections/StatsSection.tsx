import { motion } from 'framer-motion';
import { BsPeople, BsClipboardData, BsXCircle, BsCheckCircleFill } from 'react-icons/bs';
import { colors } from '../styles/colors';
import { GoalStats } from '@/app/components/shared/types';

interface StatsSectionProps {
  stats: GoalStats;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-4 gap-3"
    >
      <motion.div 
        variants={itemVariants}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2">
            <BsPeople className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-300">Employees</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white">{stats.totalEmployees}</div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2">
            <BsClipboardData className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">Goals</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white">{stats.totalGoals}</div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2">
            <BsCheckCircleFill className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">Approved</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white">{stats.approvedGoals || 0}</div>
        </div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
        <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2">
            <BsXCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-300">Rejected</span>
          </div>
          <div className="mt-2 text-xl font-bold text-white">{stats.rejectedGoals || 0}</div>
        </div>
      </motion.div>
    </motion.div>
  );
} 