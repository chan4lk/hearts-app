"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Goal, Rating, User } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import DashboardLayout from "@/app/components/layout/DashboardLayout";
import {
  BsPersonLinesFill,
  BsStar,
  BsStarFill,
  BsCheck2Circle,
  BsExclamationCircle,
  BsArrowRight,
  BsFilter,
  BsGrid,
  BsList,
  BsCheckCircle,
  BsHourglassSplit
} from "react-icons/bs";

interface GoalWithRating extends Goal {
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface EmployeeStats {
  id: string;
  name: string;
  totalGoals: number;
  ratedGoals: number;
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

export default function RateEmployeesPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);

  useEffect(() => {
    fetchEmployeeGoals();
  }, []);

  useEffect(() => {
    const stats = calculateEmployeeStats(goals);
    setEmployeeStats(stats);
  }, [goals]);

  const calculateEmployeeStats = (goals: GoalWithRating[]): EmployeeStats[] => {
    const statsMap = new Map<string, EmployeeStats>();
    
    goals.forEach(goal => {
      const { employee } = goal;
      const currentStats = statsMap.get(employee.id) || {
        id: employee.id,
        name: employee.name,
        totalGoals: 0,
        ratedGoals: 0
      };
      
      currentStats.totalGoals++;
      if (goal.rating?.score) {
        currentStats.ratedGoals++;
      }
      
      statsMap.set(employee.id, currentStats);
    });
    
    return Array.from(statsMap.values());
  };

  const fetchEmployeeGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/goals/manager");
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

  const handleRatingChange = async (goalId: string, value: number) => {
    if (isNaN(value)) return;

    try {
      const response = await fetch(`/api/goals/${goalId}/manager-rating`, {
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

      toast.success('Rating updated successfully');
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (filterEmployee !== 'all' && goal.employee.id !== filterEmployee) return false;
    if (filterRating !== 'all' && goal.rating?.score !== parseInt(filterRating)) return false;
    return true;
  });

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
              <h1 className="text-2xl font-bold text-white mb-1">Rate Employee Goals</h1>
              <p className="text-gray-400">Evaluate and provide feedback on employee performance</p>
            </div>
          </div>
        </div>

        {/* Stats and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-[#252832] border-gray-800">
            <div className="p-4">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <BsPersonLinesFill className="w-4 h-4" />
                <span className="text-sm font-medium">Total Goals</span>
              </div>
              <div className="text-2xl font-bold text-white">{goals.length}</div>
            </div>
          </Card>

          <Card className="bg-[#252832] border-gray-800">
            <div className="p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <BsCheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Rated Goals</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {goals.filter(g => g.rating?.score).length}
              </div>
            </div>
          </Card>

          <Card className="bg-[#252832] border-gray-800">
            <div className="p-4">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <BsStar className="w-4 h-4" />
                <span className="text-sm font-medium">Average Rating</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {goals.length > 0
                  ? (goals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0) / goals.length).toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </Card>
        </div>

        {/* Employee Filter */}
        <div className="flex justify-end">
          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsFilter className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="pl-10 pr-4 py-3 bg-[#252832] text-white rounded-xl border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-700 transition-all">
                <div className="flex items-center gap-2">
                  <BsPersonLinesFill className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="Filter by employee..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <BsPersonLinesFill className="w-4 h-4" />
                    <span>All Employees</span>
                  </div>
                </SelectItem>
                {employeeStats.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center justify-between w-full gap-3">
                      <div className="flex items-center gap-2">
                        <BsPersonLinesFill className="w-4 h-4" />
                        <span>{emp.name}</span>
                      </div>
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full">
                        {emp.ratedGoals}/{emp.totalGoals} rated
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goals Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
              <span>Loading goals...</span>
            </div>
          </div>
        ) : filteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map(goal => (
              <Card key={goal.id} className="bg-[#252832] border-gray-800 hover:border-gray-700 transition-all">
                <div className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white mb-1">{goal.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2">{goal.description}</p>
                    </div>
                    {goal.rating?.score && (
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
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-400">Rating</Label>
                    <Select
                      value={goal.rating?.score?.toString() || ""}
                      onValueChange={(value: string) => handleRatingChange(goal.id, parseInt(value))}
                    >
                      <SelectTrigger className="w-full bg-[#1E2028] border-gray-800">
                        <SelectValue placeholder="Select rating..." />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(rating => (
                          <SelectItem key={rating} value={rating.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                {Array.from({ length: rating }).map((_, i) => (
                                  <BsStarFill key={i} className="w-4 h-4 text-yellow-400" />
                                ))}
                              </div>
                              <span>{RATING_LABELS[rating as keyof typeof RATING_LABELS]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {goal.rating?.score && (
                      <p className="text-sm text-gray-400 mt-2">
                        {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <BsPersonLinesFill className="text-gray-400" />
                      <span className="text-sm text-gray-400">{goal.employee.name}</span>
                    </div>
                    {goal.rating?.score ? (
                      <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                        Rated
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full">
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-gray-800/30 rounded-full mb-4">
              <BsExclamationCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No goals found</h3>
            <p className="text-gray-400">
              {filterEmployee !== 'all'
                ? "No goals found for the selected employee"
                : "No goals are available for rating at this time"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 