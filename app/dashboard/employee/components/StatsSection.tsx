import { BsBarChart, BsCheckCircle, BsClock, BsTrophy, BsArrowUp, BsLightningCharge } from 'react-icons/bs';
import { GoalStats } from './types';

interface StatsSectionProps {
  stats: GoalStats;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  return (
    <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <BsTrophy className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">My Goals Dashboard</h1>
          <p className="text-gray-400">Track and manage your performance goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-indigo-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Goals</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
            </div>
            <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <BsBarChart className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <BsArrowUp className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">Active</span>
            <span className="text-gray-400 ml-1">{stats.pending} in progress</span>
          </div>
        </div>

        <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-emerald-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved Goals</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.approved}</h3>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <BsCheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <span className="text-emerald-400">{stats.achievementScore}%</span>
            <span className="text-gray-400">achievement score</span>
          </div>
        </div>

        <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-amber-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Review</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.pending}</h3>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <BsClock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <span className="text-amber-400">{stats.achievementScore}%</span>
            <span className="text-gray-400">achievement score</span>
          </div>
        </div>

        <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm">Achievement Score</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.achievementScore}%</h3>
            </div>
            <div className="bg-purple-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <BsTrophy className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm">
            <BsLightningCharge className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400">Performance</span>
            <span className="text-gray-400 ml-1">score</span>
          </div>
        </div>
      </div>
    </div>
  );
} 