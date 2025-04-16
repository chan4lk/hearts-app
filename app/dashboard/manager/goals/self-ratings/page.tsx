'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  BsStar, 
  BsStarFill, 
  BsCheckCircle, 
  BsExclamationCircle, 
  BsClock,
  BsPerson,
  BsCalendar,
  BsClipboardData,
  BsBarChart
} from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
}

const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding'
};

const RATING_COLORS = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-green-400',
  5: 'text-indigo-400'
};

export default function ManagerSelfRatingsPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      
      // Filter goals to only show those created by the manager
      const managerGoals = (data.goals || []).filter((goal: Goal) => goal.createdBy === session?.user?.id);
      setGoals(managerGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, score: number) => {
    if (isNaN(score)) return;

    try {
      setSubmitting(prev => ({ ...prev, [goalId]: true }));
      const response = await fetch(`/api/goals/${goalId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          comments: ''
        })
      });

      if (!response.ok) throw new Error('Failed to submit rating');

      // Update the goals state with the new rating
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                rating: { 
                  id: goalId,
                  score,
                  comments: ''
                } 
              } 
            : goal
        )
      );

      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(prev => ({ ...prev, [goalId]: false }));
    }
  };

  // Calculate goal statistics
  const goalStats = {
    total: goals.length,
    rated: goals.filter(g => g.rating?.score).length,
    averageRating: goals.length > 0
      ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
      : '0.0'
  };

  if (loading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsStar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Self Ratings</h1>
              <p className="text-gray-400 mt-1">Rate your performance on goals you've created</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 text-blue-400 mb-3">
              <BsClipboardData className="w-5 h-5" />
              <span className="text-lg font-semibold">Total Goals</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {goalStats.total}
            </div>
          </div>

          <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 text-green-400 mb-3">
              <BsCheckCircle className="w-5 h-5" />
              <span className="text-lg font-semibold">Rated Goals</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {goalStats.rated}
            </div>
          </div>

          <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 text-yellow-400 mb-3">
              <BsBarChart className="w-5 h-5" />
              <span className="text-lg font-semibold">Average Rating</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {goalStats.averageRating}
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="bg-[#1E2028] rounded-xl p-8 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4">
                <BsClipboardData className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
              <p className="text-gray-300">You haven't created any goals yet</p>
            </div>
          ) : (
            goals.map(goal => (
              <div
                key={goal.id}
                className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-white">{goal.title}</h3>
                    <p className="text-gray-300">{goal.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <BsCalendar className="w-4 h-4" />
                        <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BsPerson className="w-4 h-4" />
                        <span>Created by you</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    {goal.rating ? (
                      <div className={`px-4 py-2 rounded-lg ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        <div className="flex items-center gap-2">
                          <BsStarFill className="w-5 h-5" />
                          <span className="font-medium">{RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-gray-400">Rate your performance:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => handleSelfRating(goal.id, score)}
                              disabled={submitting[goal.id]}
                              className={`p-2 rounded-lg transition-colors ${
                                submitting[goal.id]
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-gray-700'
                              }`}
                            >
                              <BsStar className={`w-5 h-5 ${RATING_COLORS[score as keyof typeof RATING_COLORS]}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 