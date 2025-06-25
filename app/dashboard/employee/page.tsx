'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection from './components/StatsSection';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from './components/GoalDetailModal';
import { Goal, GoalStats } from './components/types';
import { BsGear, BsBell, BsSearch } from 'react-icons/bs';
import { showToast } from '@/app/utils/toast';
import LoadingComponent from '@/app/components/LoadingScreen';


export default function EmployeeDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load goals from the database
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const [assignedResponse, selfResponse] = await Promise.all([
          fetch('/api/goals'),
          fetch('/api/goals/self')
        ]);

        if (!assignedResponse.ok || !selfResponse.ok) {
          throw new Error('Failed to fetch goals. Please try again later.');
        }

        const [assignedData, selfData] = await Promise.all([
          assignedResponse.json(),
          selfResponse.json()
        ]);
        
        // Deduplicate goals based on their IDs
        const uniqueGoals = new Map();
        [...(assignedData.goals || []), ...(selfData.goals || [])].forEach(goal => {
          if (!uniqueGoals.has(goal.id)) {
            uniqueGoals.set(goal.id, goal);
          }
        });
        
        setGoals(Array.from(uniqueGoals.values()));
      } catch (error) {
        showToast.error('Goals Loading Error', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getGoalStats = (): GoalStats => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'COMPLETED').length;
    const modified = goals.filter(g => g.status === 'MODIFIED').length;
    const pending = goals.filter(g => g.status === 'PENDING').length;
    const approved = goals.filter(g => g.status === 'APPROVED').length;
    const rejected = goals.filter(g => g.status === 'REJECTED').length;
    const achievementScore = total > 0 ? Math.round(((completed + approved) / total) * 100) : 0;
    
    return { total, completed, modified, pending, approved, rejected, achievementScore };
  };

  const handleSubmitGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'PENDING' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit goal');
      }

      const updatedResponse = await fetch('/api/goals', { credentials: 'include' });
      if (!updatedResponse.ok) {
        throw new Error('Failed to refresh goals after submission');
      }

      const updatedData = await updatedResponse.json();
      setGoals(updatedData.goals || []);
      setShowDetailModal(false);
      showToast.goal.updated();
    } catch (error) {
      showToast.goal.error(error instanceof Error ? error.message : 'Failed to submit goal');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Optional: Show toast for no results after a delay
    if (value && !filteredGoals.length) {
      setTimeout(() => {
        if (!filteredGoals.length) {
          showToast.error('Search Results', 'No goals found matching your search criteria');
        }
      }, 500);
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    // Optional: Show toast for no results after filter
    if (value && !filteredGoals.length) {
      showToast.error('Filter Results', 'No goals found with the selected status');
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Compact Header */}
          

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatsSection stats={getGoalStats()} />
          </motion.div>

          {/* Goals Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
          >
            <GoalsSection
              goals={filteredGoals}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus}
              onSearchChange={handleSearchChange}
              onStatusChange={handleStatusChange}
              onGoalClick={(goal) => {
                setSelectedGoal(goal);
                setShowDetailModal(true);
              }}
            />
          </motion.div>

          {/* Goal Detail Modal */}
          <AnimatePresence>
            {showDetailModal && selectedGoal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-2xl border border-white/10"
                >
                  <GoalDetailModal
                    goal={selectedGoal}
                    onClose={() => {
                      setShowDetailModal(false);
                      setSelectedGoal(null);
                    }}
                    onSubmitGoal={handleSubmitGoal}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}