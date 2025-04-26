import { BsStars } from 'react-icons/bs';
import { DashboardStats } from '../types';

interface StatsDisplayProps {
  stats: DashboardStats;
  activeTab: 'employee' | 'personal';
}

export default function StatsDisplay({ stats, activeTab }: StatsDisplayProps) {
  return (
    <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <BsStars className="w-8 h-8 text-indigo-400" />
          Goals Dashboard
        </h1>
        <p className="text-gray-400 mt-1">Manage your goals and track employee progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {activeTab === 'employee' ? (
          <>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Total Employee Goals</div>
              <div className="text-2xl font-bold text-white">{stats.employeeGoals.total}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-amber-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-white">{stats.employeeGoals.pending}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-emerald-400 mb-1">Approved</div>
              <div className="text-2xl font-bold text-white">{stats.employeeGoals.approved}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-rose-400 mb-1">Rejected</div>
              <div className="text-2xl font-bold text-white">{stats.employeeGoals.rejected}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-indigo-400 mb-1">Total Employees</div>
              <div className="text-2xl font-bold text-white">{stats.employeeCount}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-emerald-400 mb-1">Active Employees</div>
              <div className="text-2xl font-bold text-white">{stats.activeEmployees}</div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">My Total Goals</div>
              <div className="text-2xl font-bold text-white">{stats.personalGoals.total}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-amber-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-white">{stats.personalGoals.pending}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-emerald-400 mb-1">Approved</div>
              <div className="text-2xl font-bold text-white">{stats.personalGoals.approved}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-rose-400 mb-1">Rejected</div>
              <div className="text-2xl font-bold text-white">{stats.personalGoals.rejected}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800 col-span-2">
              <div className="text-sm text-indigo-400 mb-1">Completion Rate</div>
              <div className="text-2xl font-bold text-white">
                {stats.personalGoals.total > 0
                  ? `${Math.round((stats.personalGoals.approved / stats.personalGoals.total) * 100)}%`
                  : '0%'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 