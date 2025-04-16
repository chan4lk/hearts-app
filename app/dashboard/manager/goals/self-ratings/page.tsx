'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Goal, Rating } from '@prisma/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsStar,
  BsStarFill,
  BsCheck2Circle,
  BsExclamationCircle,
  BsArrowRight,
  BsFilter,
  BsGrid,
  BsList,
  BsCheckCircle,
  BsHourglassSplit,
  BsClipboardData,
  BsBarChart,
  BsCalendar,
  BsPlus,
  BsX
} from 'react-icons/bs';

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
}

const RATING_COLORS = {
  1: 'bg-red-500/10 text-red-400',
  2: 'bg-orange-500/10 text-orange-400',
  3: 'bg-yellow-500/10 text-yellow-400',
  4: 'bg-blue-500/10 text-blue-400',
  5: 'bg-green-500/10 text-green-400'
};

const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Average',
  3: 'Average',
  4: 'Above Average',
  5: 'Excellent'
};

const RATING_DESCRIPTIONS = {
  1: 'Performance is below expectations and needs significant improvement.',
  2: 'Performance is below average and requires improvement in several areas.',
  3: 'Performance meets basic expectations but could be improved.',
  4: 'Performance exceeds expectations in most areas.',
  5: 'Performance consistently exceeds expectations and demonstrates excellence.'
};

const RATING_HOVER_COLORS = {
  1: 'hover:bg-red-500/20 hover:text-red-300',
  2: 'hover:bg-orange-500/20 hover:text-orange-300',
  3: 'hover:bg-yellow-500/20 hover:text-yellow-300',
  4: 'hover:bg-blue-500/20 hover:text-blue-300',
  5: 'hover:bg-green-500/20 hover:text-green-300'
};

export default function ManagerSelfRatingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchGoals();
  }, [session, router]);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/manager/self');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, score: number, comments: string = '') => {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/goals/${goalId}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, comments })
      });

      if (!response.ok) throw new Error('Failed to submit rating');

      const data = await response.json();
      setGoals(prev =>
        prev.map(goal =>
          goal.id === goalId
            ? { ...goal, rating: data }
            : goal
        )
      );
      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (selectedStatus === 'all') return true;
    return goal.status === selectedStatus;
  });

  if (loading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsStarFill className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Self Rating</h1>
              <p className="text-gray-400">Rate your performance on your goals</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center justify-center w-9 h-9 rounded transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setViewMode('list')}
              >
                <BsList className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center justify-center w-9 h-9 rounded transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                onClick={() => setViewMode('grid')}
              >
                <BsGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 text-blue-400 mb-3">
                <BsClipboardData className="w-5 h-5" />
                <span className="text-lg font-semibold">Total Goals</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {goals.length}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 text-green-400 mb-3">
                <BsCheckCircle className="w-5 h-5" />
                <span className="text-lg font-semibold">Self-Rated Goals</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {goals.filter(g => g.rating?.score).length}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 text-yellow-400 mb-3">
                <BsBarChart className="w-5 h-5" />
                <span className="text-lg font-semibold">Average Rating</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {goals.length > 0
                  ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-4">
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Goals Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {filteredGoals.map((goal) => (
            <Card key={goal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="text-xl text-white">{goal.title}</CardTitle>
                <CardDescription className="text-gray-400">{goal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <BsCalendar className="w-4 h-4" />
                    <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Self Rating</Label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant="outline"
                          size="icon"
                          onClick={() => handleSelfRating(goal.id, rating)}
                          disabled={submitting}
                          className={`w-10 h-10 ${
                            goal.rating?.score === rating
                              ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          } ${RATING_HOVER_COLORS[rating as keyof typeof RATING_HOVER_COLORS]} transition-all duration-200`}
                        >
                          <BsStarFill className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {goal.rating?.score && (
                    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <p className={`text-sm font-medium mb-2 ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                      </p>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 