import { BsClipboardData, BsCheckCircle, BsClock, BsPencil, BsXCircle } from 'react-icons/bs';
import { GoalStats, Goal } from '@/app/components/shared/types';
import { motion } from 'framer-motion';
import ManagerRatingBadge from './ManagerRatingBadge';

interface StatsSectionProps {
  stats: GoalStats;
  goals?: Goal[];
  onViewManagerRatings?: () => void;
  onStatusFilter?: (status: string) => void;
}

export default function StatsSection({ stats, goals = [], onViewManagerRatings, onStatusFilter }: StatsSectionProps) {
  // Calculate status counts from goals
  const draftCount = goals.filter(g => g.status === 'DRAFT').length;
  const approvedCount = goals.filter(g => g.status === 'APPROVED').length;
  const rejectedCount = goals.filter(g => g.status === 'REJECTED').length;
  const completedCount = goals.filter(g => g.status === 'COMPLETED').length;
  const totalCount = goals.length;

  const handleStatusClick = (status: string) => {
    if (onStatusFilter) {
      onStatusFilter(status);
    }
  };

  const statsList = [
    {
      title: 'Total Goals',
      value: totalCount,
      icon: <BsClipboardData className="w-4 h-4" />,
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      status: ''
    },
    {
      title: 'Draft',
      value: draftCount,
      icon: <BsPencil className="w-4 h-4" />,
      gradient: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      status: 'DRAFT'
    },
    {
      title: 'Approved',
      value: approvedCount,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      status: 'APPROVED'
    },
    {
      title: 'Rejected',
      value: rejectedCount,
      icon: <BsXCircle className="w-4 h-4" />,
      gradient: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      status: 'REJECTED'
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      status: 'COMPLETED'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {statsList.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={() => handleStatusClick(stat.status)}
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
          aria-label={`${stat.title}: ${stat.value} - Click to filter`}
          title={`${stat.title}: ${stat.value} - Click to filter`}
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

      {/* Manager Rating Badge */}
      <ManagerRatingBadge goals={goals} onViewRatings={onViewManagerRatings} />
    </div>
  );
}
