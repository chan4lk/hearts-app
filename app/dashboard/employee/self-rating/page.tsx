"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoadingComponent from '@/app/components/LoadingScreen';

import { toast } from "sonner";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { BackgroundElements } from "./components/BackgroundElements";
import { HeroSection } from "./components/HeroSection";
import { StatsSection } from "./components/StatsSection";
import { FiltersSection } from "./components/FiltersSection";
import { GoalCard } from "./components/GoalCard";
import { GoalWithRating, ViewMode, FilterStatus, RatingStatus, FilterRating } from "./types";

export default function SelfRatingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoalWithRating[]>([]);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [ratingComments, setRatingComments] = useState<Record<string, string>>({});
  
  // Initialize with type-safe values
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [ratingStatus, setRatingStatus] = useState<RatingStatus>('all');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'EMPLOYEE' && session.user?.role !== 'MANAGER') {
      toast.error('You do not have permission to access this page');
      router.push('/dashboard');
      return;
    }

    fetchGoals();
  }, [session, router, status]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const goalsResponse = await fetch("/api/goals/self");

      if (!goalsResponse.ok) {
        throw new Error("Failed to fetch goals");
      }

      const goalsData = await goalsResponse.json();
      
      if (!goalsData.goals || !Array.isArray(goalsData.goals)) {
        throw new Error("Invalid goals response format");
      }

      let ratingsData = { ratings: [] };
      try {
        const ratingsResponse = await fetch("/api/goals/ratings/self");
        if (ratingsResponse.ok) {
          ratingsData = await ratingsResponse.json();
        }
      } catch (error) {
        console.warn('Failed to fetch ratings, proceeding without them:', error);
      }

      const goalsWithRatings = goalsData.goals.map((goal: GoalWithRating) => ({
        ...goal,
        rating: ratingsData.ratings?.find((r: any) => r.goalId === goal.id)
      }));
      
      setGoals(goalsWithRatings);
      toast.success("Goals loaded successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load goals";
      toast.error(message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfRating = async (goalId: string, value: number) => {
    if (isNaN(value) || submitting[goalId]) return;

    try {
      setSubmitting(prev => ({ ...prev, [goalId]: true }));

      const response = await fetch(`/api/goals/${goalId}/self-rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: value,
          comments: ratingComments[goalId] || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update rating');
      }

      const updatedRating = await response.json();
      
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                rating: { 
                  id: updatedRating.id, 
                  score: value,
                  comments: updatedRating.comments || '',
                  updatedAt: updatedRating.updatedAt,
                  goalId: goalId
                } 
              } 
            : goal
        )
      );

      setRatingComments(prev => {
        const newComments = { ...prev };
        delete newComments[goalId];
        return newComments;
      });

      toast.success('Self-rating updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update rating';
      toast.error(message);
    } finally {
      setSubmitting(prev => ({ ...prev, [goalId]: false }));
    }
  };

  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
      const matchesRating = filterRating === 'all' || goal.rating?.score === parseInt(filterRating);
      const matchesRatingStatus = 
        ratingStatus === 'all' || 
        (ratingStatus === 'rated' && goal.rating) || 
        (ratingStatus === 'unrated' && !goal.rating);
      
      return matchesStatus && matchesRating && matchesRatingStatus;
    });
  }, [goals, filterStatus, filterRating, ratingStatus]);

  const stats = useMemo(() => {
    const ratedGoals = goals.filter(g => g.rating?.score);
    const totalRating = ratedGoals.reduce((acc, goal) => acc + (goal.rating?.score || 0), 0);
    const averageRating = ratedGoals.length > 0 ? (totalRating / ratedGoals.length).toFixed(1) : '0.0';

    return {
      total: goals.length,
      rated: ratedGoals.length,
      average: averageRating
    };
  }, [goals]);

  const getLayoutType = (role?: string): "manager" | "employee" | "admin" => {
    if (!role) return "employee";
    const roleLower = role.toLowerCase();
    if (roleLower === "manager" || roleLower === "employee" || roleLower === "admin") {
      return roleLower as "manager" | "employee" | "admin";
    }
    return "employee";
  };

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {session?.user?.role === 'MANAGER' && (
          <div className="mb-4 p-3 rounded bg-blue-900/80 text-blue-200 border border-blue-400 text-center">
            You are performing self-rating as a Manager. These ratings will be tracked as your own.
          </div>
        )}
        <BackgroundElements />

        <div className="relative z-10 p-6 space-y-8">
          <HeroSection userRole={session?.user?.role} />

          <StatsSection stats={stats} />

          <FiltersSection
            viewMode={viewMode}
            setViewMode={setViewMode}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterRating={filterRating}
            setFilterRating={setFilterRating}
            ratingStatus={ratingStatus}
            setRatingStatus={setRatingStatus}
          />

          {/* Goals Grid */}
          <motion.div 
            layout
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}
          >
            {filteredGoals.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No goals match the selected filters.</p>
              </div>
            ) : (
              filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  submitting={submitting}
                  handleSelfRating={handleSelfRating}
                  viewMode={viewMode}
                />
              ))
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
} 