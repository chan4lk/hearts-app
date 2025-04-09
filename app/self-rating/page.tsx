"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  BsStars, 
  BsBarChart, 
  BsCheckCircle, 
  BsLightningCharge,
  BsArrowRight,
  BsPersonCheck,
  BsClipboardCheck,
  BsGrid,
  BsList,
  BsStar,
  BsStarFill,
  BsStarHalf,
  BsSave,
  BsCheck2,
  BsPencil,
  BsFilter
} from "react-icons/bs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup
} from "@/components/ui/select";
import { motion } from "framer-motion";

interface Goal {
  id: string;
  title: string;
  description: string;
  selfRating?: number;
  comments?: string;
  previousRating?: number;
  isSubmitting?: boolean;
  lastSubmitted?: boolean;
  isEditing?: boolean;
  ratings?: { score: number; comments: string }[];
}

const RATING_DESCRIPTIONS = {
  1: {
    title: "Needs Improvement",
    description: "Performance is consistently below expectations"
  },
  2: {
    title: "Below Expectations",
    description: "Performance occasionally meets expectations but needs improvement"
  },
  3: {
    title: "Meets Expectations",
    description: "Performance consistently meets job requirements"
  },
  4: {
    title: "Exceeds Expectations",
    description: "Performance frequently exceeds job requirements"
  },
  5: {
    title: "Outstanding",
    description: "Performance consistently exceeds job requirements and expectations"
  }
} as const;

const filterOptions = {
  status: [
    { value: 'all', label: '🔍 All Goals' },
    { value: 'rated', label: '⭐ Rated Goals' },
    { value: 'unrated', label: '📝 Unrated Goals' },
    { value: 'submitted', label: '✅ Submitted Goals' }
  ],
  ratings: [
    { value: 'all', label: '🔍 All Ratings' },
    { value: '1', label: '⭐ Needs Improvement' },
    { value: '2', label: '⭐⭐ Developing' },
    { value: '3', label: '⭐⭐⭐ Meeting Expectations' },
    { value: '4', label: '⭐⭐⭐⭐ Exceeding Expectations' },
    { value: '5', label: '⭐⭐⭐⭐⭐ Outstanding' }
  ]
};

export default function SelfRatingPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'comparison'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'rated' | 'unrated' | 'submitted'>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals/employee");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      // Transform data to include previous ratings
      const goalsWithPrevious = data.map((goal: any) => ({
        ...goal,
        previousRating: goal.ratings?.[0]?.score,
        selfRating: goal.ratings?.[0]?.score,
        comments: goal.ratings?.[0]?.comments,
        isSubmitting: false,
        lastSubmitted: false
      }));
      setGoals(goalsWithPrevious);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (goalId: string, rating: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { 
        ...goal, 
        selfRating: rating, 
        lastSubmitted: false
      } : goal
    ));
  };

  const handleCommentsChange = (goalId: string, comments: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, comments, lastSubmitted: false } : goal
    ));
  };

  const handleSubmitSingle = async (goalId: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, isSubmitting: true } : goal
    ));

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const response = await fetch("/api/ratings/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings: [{
            goalId: goal.id,
            score: goal.selfRating || 0,
            comments: goal.comments || '',
          }],
        }),
      });

      if (!response.ok) throw new Error("Failed to submit rating");
      
      setGoals(goals.map(g => 
        g.id === goalId ? { ...g, isSubmitting: false, lastSubmitted: true } : g
      ));
      toast.success("Rating submitted successfully");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
      setGoals(goals.map(g => 
        g.id === goalId ? { ...g, isSubmitting: false } : g
      ));
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/ratings/self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings: goals.map(goal => ({
            goalId: goal.id,
            score: goal.selfRating || 0,
            comments: goal.comments || '',
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to submit ratings");
      setGoals(goals.map(goal => ({ ...goal, lastSubmitted: true })));
      toast.success("All ratings submitted successfully");
    } catch (error) {
      console.error("Error submitting ratings:", error);
      toast.error("Failed to submit ratings");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, previousRating, onRatingChange }: { rating?: number; previousRating?: number; onRatingChange: (rating: number) => void }) => {
    const [hover, setHover] = useState<number | null>(null);
    
    return (
      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-2xl transition-colors ${
                (hover || rating || 0) >= star
                  ? 'text-yellow-400'
                  : 'text-gray-400'
              }`}
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
            >
              <BsStarFill />
            </button>
          ))}
          <span className="ml-2 text-gray-400">
            {rating ? `${rating} out of 5` : 'Not rated'}
          </span>
        </div>
        {previousRating && previousRating !== rating && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BsStars className="w-4 h-4" />
            <span>Previous rating: {previousRating} out of 5</span>
          </div>
        )}
      </div>
    );
  };

  const RatingDescription = ({ rating }: { rating?: number }) => {
    if (!rating) return null;
    const ratingInfo = RATING_DESCRIPTIONS[rating as keyof typeof RATING_DESCRIPTIONS];
    
    return (
      <div className="bg-[#1E2028] rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <BsStars className="w-4 h-4 text-yellow-400" />
          <span className="font-medium text-white">{ratingInfo.title}</span>
        </div>
        <p className="text-sm text-gray-400">{ratingInfo.description}</p>
      </div>
    );
  };

  const handleEdit = (goalId: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, isEditing: true, lastSubmitted: false } : goal
    ));
  };

  const handleCancelEdit = (goalId: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { 
        ...goal, 
        isEditing: false,
        selfRating: goal.previousRating,
        comments: goal.ratings?.[0]?.comments || ''
      } : goal
    ));
  };

  const filteredGoals = goals.filter(goal => {
    if (filterStatus === 'rated') return goal.selfRating;
    if (filterStatus === 'unrated') return !goal.selfRating;
    if (filterStatus === 'submitted') return goal.lastSubmitted;
    return true;
  }).filter(goal => {
    if (filterRating === 'all') return true;
    return goal.selfRating === parseInt(filterRating);
  });

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const content = loading ? (
    <motion.div 
      className="flex items-center justify-center h-64"
      {...fadeIn}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
        <span>Loading goals...</span>
      </div>
    </motion.div>
  ) : (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div 
        className="bg-gradient-to-br from-[#1E2028] to-[#252832] p-8 rounded-xl shadow-lg border border-gray-800/50"
        {...fadeIn}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsPersonCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Self Rating</h1>
              <p className="text-gray-400">Rate your performance on assigned goals</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-gray-800/50">
          <div className="flex-1 min-w-[250px] space-y-2">
            <Label className="text-gray-300 font-medium flex items-center gap-2">
              <BsFilter className="w-4 h-4" />
              Filter by Status
            </Label>
            <Select
              value={filterStatus}
              onValueChange={(value: 'all' | 'rated' | 'unrated' | 'submitted') => setFilterStatus(value)}
            >
              <SelectTrigger className="w-full">
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

          <div className="flex-1 min-w-[250px] space-y-2">
            <Label className="text-gray-300 font-medium flex items-center gap-2">
              <BsStar className="w-4 h-4" />
              Filter by Rating
            </Label>
            <Select
              value={filterRating}
              onValueChange={setFilterRating}
            >
              <SelectTrigger className="w-full">
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

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden sm:block mr-2">
              <Label className="text-gray-300 font-medium">View Mode</Label>
            </div>
            <div className="flex bg-[#252832] rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-indigo-500 text-white shadow-lg' 
                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
                onClick={() => setViewMode('list')}
              >
                <BsList className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'comparison' 
                    ? 'bg-indigo-500 text-white shadow-lg' 
                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
                onClick={() => setViewMode('comparison')}
              >
                <BsGrid className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="bg-[#2A2F3A] rounded-xl p-6 border border-gray-800/50 hover:border-indigo-500/50 transition-all group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Goals</p>
                <h3 className="text-3xl font-bold text-white mt-2">{goals.length}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                <BsBarChart className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-[#2A2F3A] rounded-xl p-6 border border-gray-800/50 hover:border-emerald-500/50 transition-all group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Rated Goals</p>
                <h3 className="text-3xl font-bold text-white mt-2">
                  {goals.filter(g => g.selfRating).length}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <BsCheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-[#2A2F3A] rounded-xl p-6 border border-gray-800/50 hover:border-yellow-500/50 transition-all group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Average Rating</p>
                <h3 className="text-3xl font-bold text-white mt-2">
                  {goals.length > 0
                    ? (goals.reduce((acc, goal) => acc + (goal.selfRating || 0), 0) / goals.length).toFixed(1)
                    : '0.0'}
                </h3>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                <BsStars className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Goals Rating Section */}
      <div className={viewMode === 'list' ? 'grid gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        {filteredGoals.length > 0 ? (
          filteredGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="bg-[#2A2F3A] border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <BsClipboardCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    {goal.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-400 leading-relaxed">{goal.description}</p>
                  
                  <div className="space-y-4">
                    <Label className="text-gray-300 text-sm font-medium">Your Rating</Label>
                    {(!goal.lastSubmitted || goal.isEditing) ? (
                      <StarRating
                        rating={goal.selfRating}
                        previousRating={goal.previousRating}
                        onRatingChange={(rating) => handleRatingChange(goal.id, rating)}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <BsStarFill
                              key={star}
                              className={`text-2xl transition-colors ${
                                (goal.selfRating || 0) >= star
                                  ? 'text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {goal.selfRating} out of 5
                        </span>
                      </div>
                    )}
                  </div>

                  {goal.selfRating && (
                    <>
                      <RatingDescription rating={goal.selfRating} />
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300 text-sm font-medium">Performance Comments</Label>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <BsPencil className="w-3 h-3" />
                            <span>Share your thoughts</span>
                          </div>
                        </div>
                        <Textarea
                          className="bg-[#252832] border-gray-700/50 hover:border-indigo-500/50 focus:border-indigo-500 text-white min-h-[120px] resize-none rounded-xl transition-colors"
                          placeholder="Describe your performance, achievements, and areas for improvement..."
                          value={goal.comments || ''}
                          onChange={(e) => handleCommentsChange(goal.id, e.target.value)}
                          disabled={goal.lastSubmitted && !goal.isEditing}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-800/50">
                  <div className="text-sm">
                    {goal.lastSubmitted && !goal.isEditing && (
                      <span className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                        <BsCheck2 className="w-4 h-4" />
                        Submitted
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {goal.lastSubmitted && !goal.isEditing ? (
                      <Button
                        onClick={() => handleEdit(goal.id)}
                        className="bg-gray-700/50 hover:bg-gray-600 text-white"
                        size="sm"
                      >
                        Edit Rating
                        <BsPencil className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <>
                        {goal.isEditing && (
                          <Button
                            onClick={() => handleCancelEdit(goal.id)}
                            variant="outline"
                            size="sm"
                            className="border-gray-700 hover:bg-gray-800/50"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          onClick={() => handleSubmitSingle(goal.id)}
                          disabled={goal.isSubmitting || !goal.selfRating}
                          className={`bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                          size="sm"
                        >
                          {goal.isSubmitting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                              <span>Submitting...</span>
                            </div>
                          ) : (
                            <>
                              {goal.isEditing ? 'Update' : 'Save'} Rating
                              <BsSave className="ml-2 w-4 h-4" />
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div 
            className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400"
            {...fadeIn}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 bg-gray-800/30 rounded-full mb-4">
              <BsClipboardCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">No goals found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </motion.div>
        )}
      </div>

      <motion.div 
        className="flex justify-between items-center bg-[#2A2F3A] p-4 rounded-xl border border-gray-800/50"
        {...fadeIn}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="text-sm text-gray-400">
          {goals.filter(g => g.lastSubmitted).length} of {goals.length} goals submitted
        </div>
        <Button
          onClick={handleSubmitAll}
          disabled={submitting || goals.some(goal => !goal.selfRating) || goals.every(goal => goal.lastSubmitted)}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : (
            <>
              Submit All Ratings
              <BsArrowRight className="ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );

  return (
    <DashboardLayout type="employee">
      <div className="container mx-auto py-8 px-4">
        {content}
      </div>
    </DashboardLayout>
  );
} 