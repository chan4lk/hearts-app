'use client';

import { motion } from 'framer-motion';
import { BsBullseye, BsCheckCircle, BsClock, BsFileText, BsArrowUpRight } from 'react-icons/bs';
import { GoalStats } from '../types';

interface StatsGridProps {
  stats: GoalStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const statCards = [
    {
      icon: BsBullseye,
      title: 'Total Goals',
      value: stats.totalGoals,
      color: 'from-blue-500/80 to-blue-600/80',
      progressColor: 'from-blue-500 to-blue-600',
      hoverColor: 'text-blue-500',
      progress: 100
    },
    {
      icon: BsCheckCircle,
      title: 'Completed',
      value: stats.completedGoals,
      color: 'from-green-500/80 to-green-600/80',
      progressColor: 'from-green-500 to-green-600',
      hoverColor: 'text-green-500',
      progress: (stats.completedGoals / stats.totalGoals) * 100
    },
    {
      icon: BsClock,
      title: 'In Progress',
      value: stats.inProgressGoals,
      color: 'from-purple-500/80 to-purple-600/80',
      progressColor: 'from-purple-500 to-purple-600',
      hoverColor: 'text-purple-500',
      progress: (stats.inProgressGoals / stats.totalGoals) * 100
    },
    {
      icon: BsFileText,
      title: 'Pending',
      value: stats.pendingGoals,
      color: 'from-orange-500/80 to-orange-600/80',
      progressColor: 'from-orange-500 to-orange-600',
      hoverColor: 'text-orange-500',
      progress: (stats.pendingGoals / stats.totalGoals) * 100
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {statCards.map((card, index) => (
        <motion.div key={card.title} variants={itemVariants} className="group">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-300 border border-white/10 dark:border-gray-700/30">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 bg-gradient-to-br ${card.color} rounded-lg`}>
                <card.icon className="text-sm text-white" />
              </div>
              <BsArrowUpRight className={`text-xs text-gray-400 group-hover:${card.hoverColor} transition-colors`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5">{card.value}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{card.title}</p>
            <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${card.progress}%` }}
                transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                className={`h-full bg-gradient-to-r ${card.progressColor} rounded-full`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
} 