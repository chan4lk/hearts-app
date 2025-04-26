'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection from './components/StatsSection';
import GoalsSection from './components/GoalsSection';
import GoalDetailModal from './components/GoalDetailModal';
import { Goal, GoalStats } from './components/types';

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
        // Fetch assigned goals
        const assignedResponse = await fetch('/api/goals');
        if (!assignedResponse.ok) {
          throw new Error('Failed to fetch assigned goals');
        }
        const assignedData = await assignedResponse.json();
        
        // Fetch self-created goals
        const selfResponse = await fetch('/api/goals/self');
        if (!selfResponse.ok) {
          throw new Error('Failed to fetch self-created goals');
        }
        const selfData = await selfResponse.json();
        
        // Combine both sets of goals
        const allGoals = [...(assignedData.goals || []), ...(selfData.goals || [])];
        setGoals(allGoals);
      } catch (error) {
        console.error('Error fetching goals:', error);
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
    
    // Calculate achievement score based on completed and approved goals
    const achievementScore = total > 0 
      ? Math.round(((completed + approved) / total) * 100) 
      : 0;
    
    return { 
      total, 
      completed, 
      modified, 
      pending, 
      approved, 
      rejected, 
      achievementScore 
    };
  };

  const handleSubmitGoal = async (goalId: string, comment: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PENDING',
          employeeComment: comment
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit goal');
      }

      // Refresh goals list
      const updatedResponse = await fetch('/api/goals');
      const updatedData = await updatedResponse.json();
      setGoals(updatedData.goals || []);
    } catch (error) {
      console.error('Error submitting goal:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout type="employee">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6">
        <StatsSection stats={getGoalStats()} />
        
        <GoalsSection
          goals={filteredGoals}
          searchQuery={searchQuery}
          selectedStatus={selectedStatus}
          onSearchChange={setSearchQuery}
          onStatusChange={setSelectedStatus}
          onGoalClick={(goal) => {
            setSelectedGoal(goal);
            setShowDetailModal(true);
          }}
        />

        {showDetailModal && selectedGoal && (
          <GoalDetailModal
            goal={selectedGoal}
            onClose={() => setShowDetailModal(false)}
            onSubmitGoal={handleSubmitGoal}
          />
        )}
      </div>
    </DashboardLayout>
  );
}