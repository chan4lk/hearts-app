import { motion } from 'framer-motion';
import { BsPeople, BsStarFill, BsClipboardData, BsCheckCircle } from 'react-icons/bs';
import { GoalWithRatingExtended } from '@/app/components/shared/types';

interface StatsSectionProps {
  goals: GoalWithRatingExtended[];
  employeesCount?: number;
}

export default function StatsSection({ goals, employeesCount }: StatsSectionProps) {
  // Calculate stats from goals
  const totalGoals = goals.length;
  const ratedGoals = goals.filter(g => g.rating?.managerScore || g.rating?.score).length;
  const averageRating = totalGoals > 0
    ? (goals.reduce((acc, goal) => acc + (goal.rating?.managerScore || goal.rating?.score || 0), 0) / totalGoals).toFixed(1)
    : '0.0';
  const completionRate = totalGoals > 0 
    ? Math.round((ratedGoals / totalGoals) * 100)
    : 0;

  const stats = [
    {
      title: 'Total Goals',
      value: totalGoals,
      icon: <BsClipboardData className="w-4 h-4" />,
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: 'Rated Goals',
      value: ratedGoals,
      icon: <BsStarFill className="w-4 h-4" />,
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    },
    {
      title: 'Avg Rating',
      value: averageRating,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Completion',
      value: `${completionRate}%`,
      icon: <BsPeople className="w-4 h-4" />,
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    },
    ...(employeesCount !== undefined ? [
      {
        title: 'Employees',
        value: employeesCount,
        icon: <BsPeople className="w-4 h-4" />,
        gradient: 'from-violet-500 to-purple-500',
        bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/30'
      }
    ] : [])
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
            <div className="flex flex-col">
              <div className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-400">
                {stat.title}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
