import { BsStars, BsCheckCircle, BsXCircle, BsPeople, BsPencil } from 'react-icons/bs';
import { DashboardStats } from '@/app/components/shared/types';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

interface StatsDisplayProps {
  stats: DashboardStats;
  roleStats?: {
    admins: number;
    managers: number;
    employees: number;
    totalUsers: number;
  };
}

export default function StatsDisplay({ stats, roleStats }: StatsDisplayProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  // Define all status cards with proper icons and colors
  const statCards = [
    {
      title: 'Total Goals',
      value: stats.employeeGoals.total,
      icon: <BsStars className="w-4 h-4" />,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: 'Draft',
      value: stats.employeeGoals.draft,
      icon: <BsPencil className="w-4 h-4" />,
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30'
    },
    {
      title: 'Approved',
      value: stats.employeeGoals.approved,
      icon: <BsCheckCircle className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Rejected',
      value: stats.employeeGoals.rejected,
      icon: <BsXCircle className="w-4 h-4" />,
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30'
    },
    {
      title: 'Completed',
      value: stats.employeeGoals.completed,
      icon: <BsCheckCircle className="w-4 h-4" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    ...(roleStats ? [
      {
        title: 'Total Users',
        value: roleStats.totalUsers,
        icon: <BsPeople className="w-4 h-4" />,
        color: 'from-cyan-500 to-blue-500',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30'
      },
    ] : [
      {
        title: 'Total Employees',
        value: stats.employeeCount,
        icon: <BsPeople className="w-4 h-4" />,
        color: 'from-cyan-500 to-blue-500',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/30'
      },
    ])
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-lg p-4 shadow-lg"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Welcome back, {userName}
              <span className="inline-flex animate-bounce">✨</span>
            </h2>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" 
        role="region" 
        aria-label="Statistics"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`
              relative overflow-hidden
              ${stat.bgColor}
              backdrop-blur-sm 
              rounded-lg 
              p-3 
              border 
              ${stat.borderColor}
              hover:border-opacity-60 
              transition-all 
              duration-200 
              group 
              cursor-pointer 
              hover:shadow-lg
            `}
            tabIndex={0}
            aria-label={`${stat.title}: ${stat.value}`}
            title={`${stat.title}: ${stat.value}`}
          >
            {/* Animated background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`}></div>
            
            {/* Content */}
            <div className="relative flex items-center gap-2.5">
              {/* Icon */}
              <div className={`p-1.5 rounded-md bg-gradient-to-r ${stat.color} text-white flex-shrink-0`}>
                {stat.icon}
              </div>
              
              {/* Value and Title */}
              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-white leading-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-400 truncate">
                  {stat.title}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 