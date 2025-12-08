import { BsClipboardData, BsCheckCircle, BsPencil, BsXCircle } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface StatsSectionProps {
  goals: Goal[];
}

export default function StatsSection({ goals }: StatsSectionProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Filter to only show self-created goals
  const selfCreatedGoals = goals.filter(goal => goal.createdBy?.id === userId);

  const draftCount = selfCreatedGoals.filter(g => g.status === 'DRAFT').length;
  const approvedCount = selfCreatedGoals.filter(g => g.status === 'APPROVED').length;
  const rejectedCount = selfCreatedGoals.filter(g => g.status === 'REJECTED').length;
  const completedCount = selfCreatedGoals.filter(g => g.status === 'COMPLETED').length;
  const totalCount = selfCreatedGoals.length;

  const statsList = [
    {
      title: 'My Goals',
      value: totalCount,
      icon: <BsClipboardData className="w-4 h-4" />,
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: 'Draft',
      value: draftCount,
      icon: <BsPencil className="w-4 h-4" />,
      gradient: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30'
    },
    {
      title: 'Approved',
      value: approvedCount,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Rejected',
      value: rejectedCount,
      icon: <BsXCircle className="w-4 h-4" />,
      gradient: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30'
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statsList.map((stat, index) => (
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

