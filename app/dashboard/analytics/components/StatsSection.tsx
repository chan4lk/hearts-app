'use client';

import { motion } from 'framer-motion';
import { BsClipboardData, BsCheckCircle, BsStarFill, BsPeople, BsClockHistory, BsGraphUp, BsCheck2Circle } from 'react-icons/bs';

interface StatsSectionProps {
  analyticsData: {
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    averageRating: number;
    ratedGoals?: number;
    ratingCompletionRate?: number;
    overdueGoals?: number;
    totalUsers: number;
  };
  userRole?: string;
}

export default function StatsSection({ analyticsData, userRole }: StatsSectionProps) {
  const stats = [
    {
      title: 'Total Goals',
      value: analyticsData.totalGoals,
      icon: <BsClipboardData className="w-5 h-5" />,
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      description: 'All goals in system'
    },
    {
      title: 'Completed',
      value: analyticsData.completedGoals,
      icon: <BsCheck2Circle className="w-5 h-5" />,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      description: 'Goals completed'
    },
    {
      title: 'Completion Rate',
      value: `${analyticsData.completionRate.toFixed(1)}%`,
      icon: <BsCheckCircle className="w-5 h-5" />,
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      description: 'Success rate'
    },
    {
      title: 'Average Rating',
      value: analyticsData.averageRating.toFixed(1),
      icon: <BsStarFill className="w-5 h-5" />,
      gradient: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      description: 'Out of 5.0'
    },
    ...(analyticsData.ratedGoals !== undefined ? [{
      title: 'Rated Goals',
      value: analyticsData.ratedGoals,
      icon: <BsGraphUp className="w-5 h-5" />,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      description: 'Goals with ratings'
    }] : []),
    ...(analyticsData.overdueGoals !== undefined && analyticsData.overdueGoals > 0 ? [{
      title: 'Overdue',
      value: analyticsData.overdueGoals,
      icon: <BsClockHistory className="w-5 h-5" />,
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      description: 'Past due date'
    }] : []),
    ...(analyticsData.ratingCompletionRate !== undefined ? [{
      title: 'Rating Completion',
      value: `${analyticsData.ratingCompletionRate.toFixed(1)}%`,
      icon: <BsStarFill className="w-5 h-5" />,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      description: 'Rated vs completed'
    }] : []),
    {
      title: userRole === 'EMPLOYEE' ? 'My Goals' : userRole === 'MANAGER' ? 'Team Members' : 'Active Users',
      value: userRole === 'EMPLOYEE' ? analyticsData.totalGoals : analyticsData.totalUsers,
      icon: <BsPeople className="w-5 h-5" />,
      gradient: 'from-sky-500 to-blue-500',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/30',
      description: userRole === 'EMPLOYEE' ? 'Total assigned' : 'Active participants'
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`
            relative overflow-hidden
            ${stat.bgColor}
            backdrop-blur-sm
            rounded-xl
            p-3
            border-2
            ${stat.borderColor}
            hover:border-opacity-60
            transition-all
            duration-300
            group
            cursor-pointer
            hover:shadow-xl
            hover:scale-105
            flex items-center gap-3
          `}
          tabIndex={0}
          aria-label={`${stat.title}: ${stat.value}`}
          title={`${stat.title}: ${stat.value}`}
        >
          {/* Animated background gradient on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

          {/* Content */}
          <div className="relative flex items-center gap-3 w-full">
            {/* Icon */}
            <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} text-white shadow-lg flex-shrink-0`}>
              {stat.icon}
            </div>

            {/* Value and Title */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-2xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-gray-300 mt-0.5">
                {stat.title}
              </div>
              {stat.description && (
                <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                  {stat.description}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

