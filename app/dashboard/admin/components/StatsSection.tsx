import { BsPeople, BsBullseye, BsGraphUp, BsShieldExclamation, BsClipboardData } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface StatsSectionProps {
  stats: {
    totalUsers: number;
    employeeCount: number;
    adminCount: number;
    managerCount: number;
    totalGoals: number;
  };
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const statsList = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <BsPeople className="w-4 h-4" />,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      title: 'Employees',
      value: stats.employeeCount,
      icon: <BsPeople className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Managers',
      value: stats.managerCount,
      icon: <BsGraphUp className="w-4 h-4" />,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      title: 'Admins',
      value: stats.adminCount,
      icon: <BsShieldExclamation className="w-4 h-4" />,
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      title: 'Total Goals',
      value: stats.totalGoals,
      icon: <BsBullseye className="w-4 h-4" />,
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
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

