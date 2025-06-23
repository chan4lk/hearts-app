import { motion } from 'framer-motion';
import { BsClock, BsPeople, BsBarChart } from 'react-icons/bs';

interface StatsSectionProps {
  goalsCount: number;
  employeesCount: number;
  avgGoalsPerEmployee: number;
}

export default function StatsSection({ goalsCount, employeesCount, avgGoalsPerEmployee }: StatsSectionProps) {
  const stats = [
    {
      title: 'Pending Goals',
      value: goalsCount,
      icon: <BsClock className="w-4 h-4" />,
      color: 'from-amber-500/10 to-amber-600/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200/20 dark:border-amber-600/20'
    },
    {
      title: 'Employees',
      value: employeesCount,
      icon: <BsPeople className="w-4 h-4" />,
      color: 'from-indigo-500/10 to-indigo-600/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-indigo-200/20 dark:border-indigo-600/20'
    },
    {
      title: 'Avg. Goals/Employee',
      value: avgGoalsPerEmployee.toFixed(1),
      icon: <BsBarChart className="w-4 h-4" />,
      color: 'from-emerald-500/10 to-emerald-600/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200/20 dark:border-emerald-600/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-gradient-to-r ${stat.color} backdrop-blur-sm border ${stat.borderColor} p-3 rounded-xl`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${stat.color}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
        </motion.div>
      ))}
    </div>
  );
} 