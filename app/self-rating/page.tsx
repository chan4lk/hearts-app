"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
    comments?: string;
    updatedAt?: Date;
  };
}

const RATING_LABELS = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding"
} as const;

const RATING_DESCRIPTIONS = {
  1: "Performance consistently falls below expected standards. Significant improvement needed in key areas.",
  2: "Performance occasionally meets standards but improvement is needed to fully meet expectations.",
  3: "Performance consistently meets job requirements and expectations. Demonstrates solid competence.",
  4: "Performance frequently exceeds job requirements. Demonstrates strong skills and initiative.",
  5: "Performance consistently exceeds all expectations. Demonstrates exceptional achievements."
} as const;

const RATING_COLORS = {
  1: "text-red-400 border-red-500 bg-red-500/10",
  2: "text-orange-400 border-orange-500 bg-orange-500/10",
  3: "text-yellow-400 border-yellow-500 bg-yellow-500/10",
  4: "text-green-400 border-green-500 bg-green-500/10",
  5: "text-blue-400 border-blue-500 bg-blue-500/10"
} as const;

const RATING_HOVER_COLORS = {
  1: "hover:bg-red-500 hover:text-white",
  2: "hover:bg-orange-500 hover:text-white",
  3: "hover:bg-yellow-500 hover:text-white",
  4: "hover:bg-green-500 hover:text-white",
  5: "hover:bg-blue-500 hover:text-white"
} as const;

type FilterStatus = 'all' | 'rated' | 'unrated';
type ViewMode = 'list' | 'grid';

const filterOptions = {
  status: [
    { value: 'all', label: '🔍 All Goals' },
    { value: 'rated', label: '⭐ Rated Goals' },
    { value: 'unrated', label: '📝 Unrated Goals' }
  ],
  ratings: [
    { value: 'all', label: '🔍 All Ratings' },
    { value: '1', label: '⭐ Needs Improvement' },
    { value: '2', label: '⭐⭐ Below Expectations' },
    { value: '3', label: '⭐⭐⭐ Meets Expectations' },
    { value: '4', label: '⭐⭐⭐⭐ Exceeds Expectations' },
    { value: '5', label: '⭐⭐⭐⭐⭐ Outstanding' }
  ]
} as const;

export default function SelfRatingPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals/employee");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }
      
      setGoals(data);
      toast.success("Goals loaded successfully");
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals. Please try again.");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, value: number) => {
    if (isNaN(value)) return;

    try {
      const response = await fetch(`/api/goals/${goalId}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: value,
          comments: ''
        })
      });

      if (!response.ok) throw new Error('Failed to update rating');

      const updatedRating = await response.json();
      
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { 
              ...goal, 
              rating: { 
                id: updatedRating.id, 
                score: value,
                comments: updatedRating.comments
              } 
            } 
          : goal
      ));

      toast.success('Self-rating updated successfully');
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'rated') return goal.rating?.score;
    if (filterStatus === 'unrated') return !goal.rating?.score;
    return true;
  }).filter(goal => {
    if (filterRating === 'all') return true;
    return goal.rating?.score === parseInt(filterRating);
  });

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsStarFill className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Self Rating</h1>
              <p className="text-gray-400">Rate your performance on assigned goals</p>
            </div>
          </div>
          
          {/* View Mode - Moved to right */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">View</span>
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

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-gray-300 font-medium flex items-center gap-2">
              <BsFilter className="w-4 h-4" />
              Filter by Status
            </Label>
            <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
              <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-gray-300">
                <SelectValue placeholder="Choose status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filterOptions.status.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Filter goals based on their current status</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 font-medium flex items-center gap-2">
              <BsStar className="w-4 h-4" />
              Filter by Rating
            </Label>
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 text-gray-300">
                <SelectValue placeholder="Choose rating..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filterOptions.ratings.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Filter goals by their rating level</p>
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
                <span className="text-lg font-semibold">Rated Goals</span>
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

        {/* Goals List */}
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredGoals.map((goal) => (
            <Card key={goal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-semibold text-white">{goal.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{goal.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                    <div className="flex items-center gap-2 text-gray-400">
                      <span className="text-xs">Due Date</span>
                      <BsCalendar className="w-3.5 h-3.5" />
                      <span className="text-sm whitespace-nowrap">
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    {goal.rating?.updatedAt && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-xs">Submitted</span>
                        <BsCalendar className="w-3.5 h-3.5" />
                        <span className="text-sm whitespace-nowrap">
                          {new Date(goal.rating.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-3">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Self Rating</Label>
                    {goal.rating?.score && (
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="icon"
                        onClick={() => handleSelfRating(goal.id, rating)}
                        className={`w-12 h-12 ${
                          goal.rating?.score === rating
                            ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                            : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700/50'
                        } transition-all duration-200`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-xs mb-0.5">{rating}</span>
                          <BsStarFill className="w-4 h-4" />
                        </div>
                      </Button>
                    ))}
                  </div>
                  {goal.rating?.score && (
                    <div className="p-3 rounded bg-gray-800/50 border border-gray-700/50">
                      <p className={`text-sm font-medium ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                        {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                      </p>
                      <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                        {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredGoals.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="p-4 bg-gray-800/30 rounded-full mb-4">
                <BsClipboardData className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">No goals found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 