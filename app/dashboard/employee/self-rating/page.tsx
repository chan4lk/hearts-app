"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Goal } from "@prisma/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  BsStarFill,
  BsCheckCircle,
  BsClipboardData,
  BsBarChart,
  BsCalendar,
  BsFilter,
  BsGrid,
  BsList,
  BsStar
} from "react-icons/bs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
    comments: string;
    updatedAt?: Date;
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

export default function SelfRatingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [ratingStatus, setRatingStatus] = useState<string>('all');
  const [ratingComments, setRatingComments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    // Allow both employees and managers to access this page
    if (session.user?.role !== 'EMPLOYEE' && session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchGoals();
  }, [session, router]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals/self");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      
      if (!data.goals || !Array.isArray(data.goals)) {
        throw new Error("Invalid response format");
      }
      
      // Transform goals to include ratings
      const goalsWithRatings = await Promise.all(data.goals.map(async (goal: Goal) => {
        try {
          const ratingResponse = await fetch(`/api/goals/${goal.id}/ratings`);
          if (ratingResponse.ok) {
            const ratingData = await ratingResponse.json();
            return {
              ...goal,
              rating: ratingData.ratings?.find((r: any) => r.selfRatedById === session?.user?.id)
            };
          }
          return goal;
        } catch (error) {
          console.error(`Error fetching rating for goal ${goal.id}:`, error);
          return goal;
        }
      }));
      
      setGoals(goalsWithRatings);
      toast.success("Goals loaded successfully");
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals. Please try again.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, value: number, comments: string = '') => {
    if (isNaN(value)) return;

    try {
      setSubmitting(prev => ({ ...prev, [goalId]: true }));

      const response = await fetch(`/api/goals/${goalId}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: value,
          comments: comments || ratingComments[goalId] || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update rating');
      }

      const updatedRating = await response.json();
      
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              rating: { 
                id: updatedRating.id, 
                score: value,
                comments: updatedRating.comments || '',
                updatedAt: updatedRating.updatedAt
              } 
            } 
          : goal
      ));

      // Clear comments for this goal after successful submission
      setRatingComments(prev => {
        const newComments = { ...prev };
        delete newComments[goalId];
        return newComments;
      });

      toast.success('Self-rating updated successfully');
    } catch (error: any) {
      console.error('Error updating rating:', error);
      toast.error(error.message || 'Failed to update rating');
    } finally {
      setSubmitting(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'all' && filterRating === 'all' && ratingStatus === 'all') return true;
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    if (filterRating !== 'all' && goal.rating?.score !== parseInt(filterRating)) return false;
    if (ratingStatus === 'rated' && !goal.rating) return false;
    if (ratingStatus === 'unrated' && goal.rating) return false;
    return true;
  });

  const getLayoutType = (role?: string): "manager" | "employee" | "admin" => {
    if (!role) return "employee";
    const roleLower = role.toLowerCase();
    if (roleLower === "manager" || roleLower === "employee" || roleLower === "admin") {
      return roleLower as "manager" | "employee" | "admin";
    }
    return "employee";
  };

  if (loading) {
    return (
      <DashboardLayout type={getLayoutType(session?.user?.role)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type={getLayoutType(session?.user?.role)}>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-xl">
              <BsStarFill className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Self Rating</h1>
              <p className="text-sm sm:text-base text-gray-400">
                {session?.user?.role === 'MANAGER' 
                  ? 'Rate your performance on your goals'
                  : 'Rate your performance on assigned goals'}
              </p>
            </div>
          </div>
          
          {/* View Mode */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm text-gray-400">View</span>
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded transition-all duration-200 ${
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
                className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded transition-all duration-200 ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 text-blue-400 mb-2 sm:mb-3">
                <BsClipboardData className="w-5 h-5" />
                <span className="text-base sm:text-lg font-semibold">Total Goals</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {goals.length}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 text-green-400 mb-2 sm:mb-3">
                <BsCheckCircle className="w-5 h-5" />
                <span className="text-base sm:text-lg font-semibold">Rated Goals</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {goals.filter(g => g.rating?.score).length}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all sm:col-span-2 lg:col-span-1">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 text-yellow-400 mb-2 sm:mb-3">
                <BsBarChart className="w-5 h-5" />
                <span className="text-base sm:text-lg font-semibold">Average Rating</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {goals.length > 0
                  ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Statuses</SelectItem>
              <SelectItem value="PENDING" className="text-amber-400 hover:bg-gray-700">Pending</SelectItem>
              <SelectItem value="APPROVED" className="text-emerald-400 hover:bg-gray-700">Approved</SelectItem>
              <SelectItem value="REJECTED" className="text-rose-400 hover:bg-gray-700">Rejected</SelectItem>
              <SelectItem value="COMPLETED" className="text-blue-400 hover:bg-gray-700">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterRating}
            onValueChange={setFilterRating}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Ratings</SelectItem>
              <SelectItem value="1" className="text-red-400 hover:bg-gray-700">Needs Improvement</SelectItem>
              <SelectItem value="2" className="text-orange-400 hover:bg-gray-700">Below Average</SelectItem>
              <SelectItem value="3" className="text-yellow-400 hover:bg-gray-700">Average</SelectItem>
              <SelectItem value="4" className="text-blue-400 hover:bg-gray-700">Above Average</SelectItem>
              <SelectItem value="5" className="text-green-400 hover:bg-gray-700">Excellent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={ratingStatus}
            onValueChange={setRatingStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by rating status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all" className="text-white hover:bg-gray-700">All Goals</SelectItem>
              <SelectItem value="rated" className="text-emerald-400 hover:bg-gray-700">Rated Goals</SelectItem>
              <SelectItem value="unrated" className="text-amber-400 hover:bg-gray-700">Unrated Goals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Goals List */}
        <div className={`grid gap-4 sm:gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredGoals.map((goal) => (
            <Card key={goal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">{goal.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{goal.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      goal.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      goal.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-400' :
                      goal.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                      goal.status === 'MODIFIED' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {goal.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Self Rating</Label>
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant="outline"
                          size="icon"
                          onClick={() => handleSelfRating(goal.id, rating)}
                          disabled={submitting[goal.id]}
                          className={`w-8 h-8 sm:w-10 sm:h-10 ${
                            goal.rating?.score === rating
                              ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          } ${RATING_HOVER_COLORS[rating as keyof typeof RATING_HOVER_COLORS]} transition-all duration-200`}
                        >
                          <BsStarFill className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {goal.rating?.score && (
                    <div className="p-3 sm:p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <p className={`text-sm font-medium mb-1 sm:mb-2 ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
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