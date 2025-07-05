'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
import { FeedbackCycle, Feedback360, Feedback360Stats } from '@/app/components/shared/types';
import { BsPeople, BsClipboardCheck, BsStar, BsCalendar, BsArrowRight } from 'react-icons/bs';

export default function Feedback360Dashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<FeedbackCycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<FeedbackCycle | null>(null);
  const [feedbacksToGive, setFeedbacksToGive] = useState<Feedback360[]>([]);
  const [feedbacksToReceive, setFeedbacksToReceive] = useState<Feedback360[]>([]);
  const [stats, setStats] = useState<Feedback360Stats | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch feedback cycles
      const cyclesResponse = await fetch('/api/feedback-cycles');
      if (cyclesResponse.ok) {
        const cyclesData = await cyclesResponse.json();
        setCycles(cyclesData.cycles);
        
        // Set active cycle (most recent active cycle)
        const active = cyclesData.cycles.find((cycle: FeedbackCycle) => 
          cycle.status === 'ACTIVE'
        );
        setActiveCycle(active || null);
      }

      // Fetch feedbacks to give and receive if there's an active cycle
      if (activeCycle) {
        await Promise.all([
          fetchFeedbacksToGive(activeCycle.id),
          fetchFeedbacksToReceive(activeCycle.id)
        ]);
      }

      // Fetch stats
      await fetchStats();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacksToGive = async (cycleId: string) => {
    try {
      const response = await fetch(`/api/feedback-360?cycleId=${cycleId}&type=to-give`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacksToGive(data.feedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedbacks to give:', error);
    }
  };

  const fetchFeedbacksToReceive = async (cycleId: string) => {
    try {
      const response = await fetch(`/api/feedback-360?cycleId=${cycleId}&type=to-receive`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacksToReceive(data.feedbacks);
      }
    } catch (error) {
      console.error('Error fetching feedbacks to receive:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/feedback-360/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type={session?.user?.role === 'ADMIN' ? 'admin' : 'manager'}>
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  360° Feedback Dashboard
                </h1>
                <p className="text-purple-100">
                  Comprehensive performance assessment from multiple perspectives
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {stats?.totalCycles || 0}
                </div>
                <div className="text-purple-100 text-sm">Total Cycles</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Active Cycles"
                value={stats.activeCycles}
                icon={<BsCalendar className="w-5 h-5" />}
                color="from-blue-500 to-cyan-500"
              />
              <StatsCard
                title="Completion Rate"
                value={`${stats.averageCompletionRate}%`}
                icon={<BsClipboardCheck className="w-5 h-5" />}
                color="from-green-500 to-emerald-500"
              />
              <StatsCard
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                icon={<BsStar className="w-5 h-5" />}
                color="from-yellow-500 to-orange-500"
              />
              <StatsCard
                title="Total Feedbacks"
                value={stats.totalFeedbacks}
                icon={<BsPeople className="w-5 h-5" />}
                color="from-purple-500 to-pink-500"
              />
            </div>
          )}

          {/* Active Cycle Section */}
          {activeCycle && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Active Feedback Cycle: {activeCycle.name}
                </h2>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feedbacks to Give */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <BsArrowRight className="w-4 h-4 text-blue-400" />
                    Feedbacks to Give
                  </h3>
                  <div className="space-y-3">
                    {feedbacksToGive.length === 0 ? (
                      <p className="text-gray-400 text-sm">No pending feedbacks to give</p>
                    ) : (
                      feedbacksToGive.map((feedback) => (
                        <FeedbackCard
                          key={feedback.id}
                          feedback={feedback}
                          type="to-give"
                          onAction={() => {/* Navigate to feedback form */}}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Feedbacks to Receive */}
                <div className="bg-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <BsPeople className="w-4 h-4 text-green-400" />
                    Feedbacks to Receive
                  </h3>
                  <div className="space-y-3">
                    {feedbacksToReceive.length === 0 ? (
                      <p className="text-gray-400 text-sm">No feedbacks received yet</p>
                    ) : (
                      feedbacksToReceive.map((feedback) => (
                        <FeedbackCard
                          key={feedback.id}
                          feedback={feedback}
                          type="to-receive"
                          onAction={() => {/* Navigate to feedback view */}}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Cycles */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">All Feedback Cycles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cycles.map((cycle) => (
                <CycleCard
                  key={cycle.id}
                  cycle={cycle}
                  isActive={cycle.id === activeCycle?.id}
                  onClick={() => setActiveCycle(cycle)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color} text-white`}>
          {icon}
        </div>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
    </motion.div>
  );
}

// Feedback Card Component
function FeedbackCard({ feedback, type, onAction }: {
  feedback: Feedback360;
  type: 'to-give' | 'to-receive';
  onAction: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-gray-600/30 rounded-lg p-3 border border-gray-600/50 cursor-pointer"
      onClick={onAction}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">
          {type === 'to-give' ? feedback.employee?.name : feedback.reviewer?.name}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs ${
          type === 'to-give' 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'bg-green-500/20 text-green-400'
        }`}>
          {feedback.reviewerType}
        </span>
      </div>
      <p className="text-xs text-gray-400">
        {type === 'to-give' ? 'Review for' : 'Reviewed by'} {feedback.employee?.position}
      </p>
    </motion.div>
  );
}

// Cycle Card Component
function CycleCard({ cycle, isActive, onClick }: {
  cycle: FeedbackCycle;
  isActive: boolean;
  onClick: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/20 text-green-400';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
      case 'DRAFT': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gray-700/30 rounded-lg p-4 border cursor-pointer transition-all ${
        isActive 
          ? 'border-purple-500/50 bg-purple-500/10' 
          : 'border-gray-600/50 hover:border-gray-500/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-white">{cycle.name}</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(cycle.status)}`}>
          {cycle.status}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{cycle.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(cycle.startDate).toLocaleDateString()}</span>
        <span>{new Date(cycle.endDate).toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
} 