import { BsBarChart, BsCheckCircle, BsClock, BsTrophy, BsArrowUp, BsLightningCharge, BsStars } from 'react-icons/bs';
import { GoalStats } from './types';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

interface StatsSectionProps {
  stats: GoalStats;
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'User';

  return (
    <div className="space-y-3">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative px-3 py-3 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="bg-white/20 p-1 rounded-lg">
                <BsStars className="w-3 h-3 text-white" />
              </div>
              <span className="text-white/90 text-[10px] font-medium bg-white/10 px-1.5 py-0.5 rounded-full">
                Performance
              </span>
            </div>
            <h1 className="text-lg font-bold text-white">
              Welcome back, {userName}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-white/60 bg-white/10 px-2 py-1 rounded-full">
            <BsLightningCharge className="w-3 h-3" />
            <span>Track your goals</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Goals */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="group relative bg-gray-900/90 rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 border border-white/10 group-hover:border-indigo-500/20 rounded-xl transition-colors"></div>
          <div className="relative p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all">
                <BsBarChart className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full group-hover:bg-indigo-500/20 transition-colors">
                Total Goals
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">{stats.total}</h3>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <BsArrowUp className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{stats.pending}</span>
                <span className="text-gray-400 group-hover:text-gray-300">in progress</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Approved Goals */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="group relative bg-gray-900/90 rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 border border-white/10 group-hover:border-emerald-500/20 rounded-xl transition-colors"></div>
          <div className="relative p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                <BsCheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full group-hover:bg-emerald-500/20 transition-colors">
                Approved
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-200 transition-colors">{stats.approved}</h3>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <span className="text-emerald-400 font-medium">{stats.achievementScore}%</span>
                <span className="text-gray-400 group-hover:text-gray-300">achievement rate</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Review */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="group relative bg-gray-900/90 rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 border border-white/10 group-hover:border-amber-500/20 rounded-xl transition-colors"></div>
          <div className="relative p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="bg-amber-500/10 p-2 rounded-lg group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
                <BsClock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full group-hover:bg-amber-500/20 transition-colors">
                Pending
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-200 transition-colors">{stats.pending}</h3>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <span className="text-amber-400 font-medium">{stats.modified}</span>
                <span className="text-gray-400 group-hover:text-gray-300">modified goals</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievement Score */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -2 }}
          className="group relative bg-gray-900/90 rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 border border-white/10 group-hover:border-purple-500/20 rounded-xl transition-colors"></div>
          <div className="relative p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                <BsTrophy className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full group-hover:bg-purple-500/20 transition-colors">
                Achievement
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition-colors">{stats.achievementScore}%</h3>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <BsLightningCharge className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400 font-medium">Performance</span>
                <span className="text-gray-400 group-hover:text-gray-300">score</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 