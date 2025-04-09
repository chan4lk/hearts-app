"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Goal, Rating, User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  BsPersonLinesFill,
  BsStar,
  BsStarFill,
  BsStarHalf,
  BsCheck2Circle,
  BsExclamationCircle,
  BsArrowRight,
  BsFilter,
  BsGrid,
  BsList
} from "react-icons/bs";

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
  };
  employee: User;
}

const RATING_DESCRIPTIONS = {
  1: { title: "Needs Improvement", description: "Performance is below expected levels" },
  2: { title: "Below Expectations", description: "Performance needs development" },
  3: { title: "Meets Expectations", description: "Solid performance meeting requirements" },
  4: { title: "Exceeds Expectations", description: "Performance exceeds requirements" },
  5: { title: "Outstanding", description: "Exceptional performance" }
} as const;

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');

  useEffect(() => {
    fetchEmployeeGoals();
  }, []);

  const fetchEmployeeGoals = async () => {
    try {
      const response = await fetch("/api/goals/manager");
      if (!response.ok) throw new Error("Failed to fetch goals");
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (goalId: string, value: string) => {
    const numericValue = parseInt(value);
    if (isNaN(numericValue)) return;

    setGoals(goals.map(goal => 
      goal.id === goalId 
        ? { 
            ...goal, 
            rating: { 
              id: goal.rating?.id || "", 
              score: numericValue 
            } 
          } 
        : goal
    ));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/ratings/manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratings: goals.map(goal => ({
            goalId: goal.id,
            score: goal.rating?.score || 0,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to submit ratings");
      toast.success("Ratings submitted successfully");
      await fetchEmployeeGoals(); // Refresh goals after submission
    } catch (error) {
      console.error("Error submitting ratings:", error);
      toast.error("Failed to submit ratings");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterEmployee !== 'all' && goal.employee.id !== filterEmployee) return false;
    if (filterRating !== 'all' && goal.rating?.score !== parseInt(filterRating)) return false;
    return true;
  });

  const uniqueEmployees = Array.from(new Set(goals.map(goal => goal.employee)))
    .map(employee => ({
      id: employee.id,
      name: employee.name
    }));

  const content = loading ? (
    <motion.div 
      className="flex items-center justify-center h-64"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsPersonLinesFill className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Rate Employees</h1>
              <p className="text-gray-400">Evaluate employee performance and provide ratings</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-6 mb-6 pb-6 border-b border-gray-800/50">
          <div className="flex-1 min-w-[250px] space-y-2">
            <Label className="text-gray-300 font-medium flex items-center gap-2">
              <BsFilter className="w-4 h-4" />
              Filter by Employee
            </Label>
            <Select
              value={filterEmployee}
              onValueChange={setFilterEmployee}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose employee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">👥 All Employees</SelectItem>
                  {uniqueEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      👤 {emp.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
                  <SelectItem value="all">🔍 All Ratings</SelectItem>
                  {Object.entries(RATING_DESCRIPTIONS).map(([rating, { title }]) => (
                    <SelectItem key={rating} value={rating}>
                      {"⭐".repeat(parseInt(rating))} {title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
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
                  viewMode === 'grid' 
                    ? 'bg-indigo-500 text-white shadow-lg' 
                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
                onClick={() => setViewMode('grid')}
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
                <BsPersonLinesFill className="w-6 h-6 text-indigo-400" />
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
                  {goals.filter(g => g.rating?.score).length}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                <BsCheck2Circle className="w-6 h-6 text-emerald-400" />
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
                    ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                    : '0.0'}
                </h3>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                <BsStarFill className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Goals Rating Section */}
      <div className={viewMode === 'list' ? 'space-y-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
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
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <BsPersonLinesFill className="w-5 h-5 text-indigo-400" />
                      </div>
                      <span className="text-white">{goal.employee.name}</span>
                    </div>
                    {goal.rating?.score && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <BsStarFill
                              key={star}
                              className={`w-4 h-4 ${
                                (goal.rating?.score || 0) >= star
                                  ? 'text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">{goal.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{goal.description}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-300 text-sm font-medium flex items-center gap-2">
                        <BsStar className="w-4 h-4" />
                        Performance Rating
                      </Label>
                      <Select
                        value={goal.rating?.score?.toString() || ""}
                        onValueChange={(value: string) => handleRatingChange(goal.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select rating..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(RATING_DESCRIPTIONS).map(([rating, { title, description }]) => (
                              <SelectItem key={rating} value={rating}>
                                <div className="flex items-center gap-2">
                                  <span>{"⭐".repeat(parseInt(rating))}</span>
                                  <span>{title}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    {goal.rating?.score && (
                      <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                        <p className="text-sm text-gray-400">
                          {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS].description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div 
            className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 bg-gray-800/30 rounded-full mb-4">
              <BsExclamationCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">No goals found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </motion.div>
        )}
      </div>

      <motion.div 
        className="flex justify-between items-center bg-[#2A2F3A] p-4 rounded-xl border border-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="text-sm text-gray-400">
          {goals.filter(g => g.rating?.score).length} of {goals.length} goals rated
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || goals.some(goal => !goal.rating?.score)}
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
    <DashboardLayout type="manager">
      <div className="container mx-auto py-8 px-4">
        {content}
      </div>
    </DashboardLayout>
  );
} 