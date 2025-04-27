'use client';

import { BsPeople, BsCheckCircle, BsClock, BsListTask } from 'react-icons/bs';
import { GoalStats as GoalStatsType } from './types';

interface GoalStatsProps {
  stats: GoalStatsType;
}

export function GoalStats({ stats }: GoalStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <BsPeople className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Employees</p>
            <h3 className="text-2xl font-bold text-white">{stats.totalEmployees}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <BsCheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Completed Goals</p>
            <h3 className="text-2xl font-bold text-white">{stats.completedGoals}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10">
            <BsClock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Pending Goals</p>
            <h3 className="text-2xl font-bold text-white">{stats.pendingGoals}</h3>
          </div>
        </div>
      </div>

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gray-500/10">
            <BsListTask className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Draft Goals</p>
            <h3 className="text-2xl font-bold text-white">{stats.draftGoals}</h3>
          </div>
        </div>
      </div>
    </div>
  );
} 