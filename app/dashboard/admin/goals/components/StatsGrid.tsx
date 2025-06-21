'use client';

import { motion } from 'framer-motion';
import { BsBullseye, BsCheckCircle, BsClock, BsFileText, BsArrowUpRight, BsStars } from 'react-icons/bs';
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
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
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

  const statCards = [
    {
      icon: BsBullseye,
      title: 'Total Goals',
      value: stats.totalGoals,
      color: 'from-blue-500 via-blue-400 to-blue-600',
      glowColor: 'group-hover:shadow-blue-500/20',
      textColor: 'text-blue-500',
      progress: 100
    },
    {
      icon: BsCheckCircle,
      title: 'Completed',
      value: stats.completedGoals,
      color: 'from-emerald-500 via-emerald-400 to-emerald-600',
      glowColor: 'group-hover:shadow-emerald-500/20',
      textColor: 'text-emerald-500',
      progress: (stats.completedGoals / stats.totalGoals) * 100
    },
    {
      icon: BsClock,
      title: 'In Progress',
      value: stats.inProgressGoals,
      color: 'from-violet-500 via-violet-400 to-violet-600',
      glowColor: 'group-hover:shadow-violet-500/20',
      textColor: 'text-violet-500',
      progress: (stats.inProgressGoals / stats.totalGoals) * 100
    },
    {
      icon: BsFileText,
      title: 'Pending',
      value: stats.pendingGoals,
      color: 'from-amber-500 via-amber-400 to-amber-600',
      glowColor: 'group-hover:shadow-amber-500/20',
      textColor: 'text-amber-500',
      progress: (stats.pendingGoals / stats.totalGoals) * 100
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {statCards.map((card, index) => (
        <motion.div 
          key={card.title} 
          variants={itemVariants} 
          className={`group relative ${card.glowColor} hover:shadow-2xl transition-all duration-500`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-gray-900/50 backdrop-blur-md rounded-xl border border-white/[0.05]" />
          
          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} shadow-lg`}>
                  <card.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">{card.title}</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.2, rotate: 15 }}
                className="relative"
              >
                <BsArrowUpRight className={`w-3.5 h-3.5 ${card.textColor} transition-colors`} />
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 ${card.textColor} blur-sm`}
                />
              </motion.div>
            </div>

            {/* Value */}
            <div className="mb-3">
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-white">{card.value}</h3>
                <BsStars className={`w-3.5 h-3.5 ${card.textColor} animate-pulse`} />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 bg-gray-800/50 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${card.progress}%` }}
                transition={{ 
                  duration: 1.5, 
                  delay: 0.2 + (index * 0.1),
                  ease: "easeOut"
                }}
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${card.color}`}
              />
              <motion.div 
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
} 