'use client';

import { motion } from 'framer-motion';
import { BsStarFill } from 'react-icons/bs';
import ChartCard from './ChartCard';
import type { AnalyticsData } from '@/app/hooks/useAnalyticsData';

interface PerformanceTableProps {
  data: AnalyticsData['employeePerformance'];
  userRole: string;
}

export default function PerformanceTable({ data, userRole }: PerformanceTableProps) {
  if (data.length === 0) return null;

  const title = userRole === 'EMPLOYEE'
    ? 'My Performance'
    : userRole === 'MANAGER'
      ? 'Team Performance'
      : 'Top Performers';

  const description = userRole === 'EMPLOYEE'
    ? 'Your performance metrics breakdown'
    : userRole === 'MANAGER'
      ? 'Performance overview of your team'
      : 'Top performing employees';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-2"
    >
      <ChartCard title={title} description={description}>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-theme">
                <th className="text-left py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Employee</th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Total</th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Completed</th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Rate</th>
                <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {data.map((emp, index) => {
                const isHighPerformer = emp.completionRate >= 80 && emp.averageRating >= 4.0;
                return (
                  <motion.tr
                    key={emp.employeeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className={`border-b border-gray-800/30 hover:bg-gray-800/40 transition-all duration-200 ${isHighPerformer ? 'bg-green-500/5' : ''}`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isHighPerformer ? 'bg-green-500' : 'bg-gray-600'}`} />
                        <span className="text-white font-medium">{emp.employeeName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-gray-200 font-medium">{emp.totalGoals}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-green-400 font-medium">{emp.completedGoals}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`font-semibold ${emp.completionRate >= 80 ? 'text-green-400' : emp.completionRate >= 50 ? 'text-warning' : 'text-red-400'}`}>
                        {emp.completionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-warning font-medium">{emp.averageRating.toFixed(1)}</span>
                        <BsStarFill className="w-3 h-3 text-warning" />
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </motion.div>
  );
}
