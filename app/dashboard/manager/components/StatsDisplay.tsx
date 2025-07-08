import { BsStars, BsCheckCircle, BsClock, BsExclamationCircle, BsXCircle, BsPeople, BsPersonCheck, BsShield, BsPersonBadge } from 'react-icons/bs';
import { DashboardStats } from '@/app/components/shared/types';
import { useSession } from 'next-auth/react';

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

  const statCards = [
    {
      title: 'Total Goals',
      value: stats.employeeGoals.total,
      icon: <BsStars className="w-4 h-4" />,
      color: 'from-indigo-500 to-purple-500'
    },
    {
      title: 'Pending',
      value: stats.employeeGoals.pending,
      icon: <BsClock className="w-4 h-4" />,
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Approved',
      value: stats.employeeGoals.approved,
      icon: <BsCheckCircle className="w-4 h-4" />,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Rejected',
      value: stats.employeeGoals.rejected,
      icon: <BsXCircle className="w-4 h-4" />,
      color: 'from-rose-500 to-red-500'
    },
    ...(roleStats ? [
      {
        title: 'Total Users',
        value: roleStats.totalUsers,
        icon: <BsPeople className="w-4 h-4" />,
        color: 'from-blue-500 to-cyan-500'
      },

    ] : [
      {
        title: 'Total Employees',
        value: stats.employeeCount,
        icon: <BsPeople className="w-4 h-4" />,
        color: 'from-blue-500 to-cyan-500'
      },
      
    ])
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-6 shadow-lg">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Welcome back, {userName}
              <span className="inline-flex animate-bounce">✨</span>
            </h2>
            
            
          </div>

        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 gap-y-4" role="region" aria-label="Statistics">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-gray-700/50 hover:border-indigo-400/60 transition-all duration-300 group flex flex-col items-start sm:items-center focus:outline-none focus:ring-2 focus:ring-indigo-400 gap-1 cursor-pointer hover:shadow-lg"
            tabIndex={0}
            aria-label={stat.title + ': ' + stat.value}
            title={stat.title + ': ' + stat.value}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-md bg-gradient-to-r ${stat.color} text-white`}>
                {stat.icon}
              </div>
              <span className="text-xs sm:text-sm text-gray-400 font-medium">{stat.title}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 