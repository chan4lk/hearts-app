import { BsStars } from 'react-icons/bs';
import { DashboardStats } from '../types';
import { useSession } from 'next-auth/react';

interface StatsDisplayProps {
  stats: DashboardStats;
}

export default function StatsDisplay({ stats }: StatsDisplayProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  return (
    <>
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-rose-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Welcome Section with Glass Morphism */}
      <div className="relative bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-8 text-white shadow-2xl border border-white/20 mb-8 animate-in slide-in-from-top-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome back, {userName} <span className="font-extrabold">✨</span>
          </h1>
          <p className="text-lg text-white/80">Manage your goals and track employee progress</p>
        </div>
      </div>
      
      {/* Stats Dashboard with Glass Morphism */}
      <div className="relative bg-[#1E2028]/80 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white/10 space-y-8 animate-in slide-in-from-bottom-0 duration-700 delay-200">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
              <BsStars className="w-6 h-6 text-white" />
            </div>
            Goals Dashboard
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
              <div className="text-sm text-gray-300 mb-2 font-medium">Total Employee Goals</div>
              <div className="text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors">{stats.employeeGoals.total}</div>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/20">
              <div className="text-sm text-amber-400 mb-2 font-medium">Pending</div>
              <div className="text-3xl font-bold text-white group-hover:text-amber-300 transition-colors">{stats.employeeGoals.pending}</div>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20">
              <div className="text-sm text-emerald-400 mb-2 font-medium">Approved</div>
              <div className="text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors">{stats.employeeGoals.approved}</div>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 hover:border-rose-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-rose-500/20">
              <div className="text-sm text-rose-400 mb-2 font-medium">Rejected</div>
              <div className="text-3xl font-bold text-white group-hover:text-rose-300 transition-colors">{stats.employeeGoals.rejected}</div>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20">
              <div className="text-sm text-indigo-400 mb-2 font-medium">Total Employees</div>
              <div className="text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors">{stats.employeeCount}</div>
            </div>
            <div className="group bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-600/30 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20">
              <div className="text-sm text-emerald-400 mb-2 font-medium">Active Employees</div>
              <div className="text-3xl font-bold text-white group-hover:text-emerald-300 transition-colors">{stats.activeEmployees}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 