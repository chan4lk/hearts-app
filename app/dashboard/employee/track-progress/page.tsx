'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { Goal } from '@/app/components/shared/types';
import LoadingComponent from '@/app/components/LoadingScreen';

export default function TrackProgressPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals?view=my-goals&status=APPROVED');
      if (!response.ok) throw new Error('Failed to fetch goals');

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">My Goals</h1>
          <GoalsTable
            goals={goals}
            onGoalClick={(goal) => {
              // Goal detail modal will be handled by the table component
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 