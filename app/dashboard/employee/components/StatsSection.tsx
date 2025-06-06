import { BsBarChart, BsCheckCircle, BsClock, BsTrophy, BsArrowUp, BsLightningCharge } from 'react-icons/bs';
import { GoalStats } from './types';
import { useSession } from 'next-auth/react';

interface StatsSectionProps {
  stats: GoalStats;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';
  // Company is hardcoded to fix TypeScript error
  // const company = session?.user?.company || 'BISTEC Global';

  return (
    <>
      <div className="w-full mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-8 flex flex-col justify-center" style={{minHeight: '110px'}}>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Welcome back, {userName} <span className="font-extrabold"></span>
        </h1>
        <p className="text-lg text-white/80">Track and manage your performance goals</p>
      </div>
      <div className="bg-[#1E2028] p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-500/10 p-2 rounded-lg">
            <BsTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">My Goals Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-indigo-500/50 transition-all group active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Goals</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.total}</h3>
              </div>
              <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <BsBarChart className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
              <BsArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="text-emerald-400">Active</span>
              <span className="text-gray-400 ml-1">{stats.pending} in progress</span>
            </div>
          </div>

          <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-emerald-500/50 transition-all group active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Approved Goals</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.approved}</h3>
              </div>
              <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <BsCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
              <span className="text-emerald-400">{stats.achievementScore}%</span>
              <span className="text-gray-400">achievement score</span>
            </div>
          </div>

          <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-amber-500/50 transition-all group active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Review</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.pending}</h3>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <BsClock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
              <span className="text-amber-400">{stats.modified}</span>
              <span className="text-gray-400">modified goals</span>
            </div>
          </div>

          <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition-all group active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Achievement Score</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.achievementScore}%</h3>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <BsTrophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs sm:text-sm">
              <BsLightningCharge className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              <span className="text-purple-400">Performance</span>
              <span className="text-gray-400 ml-1">score</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 