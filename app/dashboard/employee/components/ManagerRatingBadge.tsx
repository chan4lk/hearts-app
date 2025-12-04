'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BsStar, BsStarFill, BsPersonCheck } from 'react-icons/bs';
import { RATING_COLORS, RATING_LABELS } from '@/app/components/shared/constants';
import { useSession } from 'next-auth/react';

interface ManagerRatingBadgeProps {
  goals: any[];
  onViewRatings?: () => void;
}

export default function ManagerRatingBadge({ goals, onViewRatings }: ManagerRatingBadgeProps) {
  const { data: session } = useSession();
  const [managerRatings, setManagerRatings] = useState<{
    total: number;
    rated: number;
    average: number;
    latestRating: number | null;
    latestComment: string | null;
  }>({
    total: 0,
    rated: 0,
    average: 0,
    latestRating: null,
    latestComment: null
  });

  useEffect(() => {
    // Filter goals that have manager ratings
    const ratedGoals = goals.filter(goal => goal.rating?.managerScore);
    
    if (ratedGoals.length === 0) {
      setManagerRatings({
        total: goals.length,
        rated: 0,
        average: 0,
        latestRating: null,
        latestComment: null
      });
      return;
    }

    // Calculate statistics
    const ratings = ratedGoals.map(goal => goal.rating.managerScore).filter(Boolean);
    const average = ratings.length > 0 
      ? Math.round((ratings.reduce((sum, score) => sum + score, 0) / ratings.length) * 10) / 10
      : 0;

    // Get latest rating (most recent managerRatedAt)
    const latestGoal = ratedGoals.reduce((latest, current) => {
      const latestDate = latest.rating?.managerRatedAt 
        ? new Date(latest.rating.managerRatedAt).getTime() 
        : 0;
      const currentDate = current.rating?.managerRatedAt 
        ? new Date(current.rating.managerRatedAt).getTime() 
        : 0;
      return currentDate > latestDate ? current : latest;
    }, ratedGoals[0]);

    setManagerRatings({
      total: goals.length,
      rated: ratedGoals.length,
      average,
      latestRating: latestGoal.rating?.managerScore || null,
      latestComment: latestGoal.rating?.managerComments || null
    });
  }, [goals]);

  const hasRatings = managerRatings.rated > 0;
  const ratingColor = managerRatings.latestRating 
    ? RATING_COLORS[managerRatings.latestRating as keyof typeof RATING_COLORS]
    : 'bg-gray-500/10 text-gray-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.35 }}
      onClick={onViewRatings}
      className={`
        relative overflow-hidden
        bg-amber-500/10
        backdrop-blur-sm
        rounded-xl
        p-3
        border-2
        border-amber-500/30
        hover:border-opacity-60
        transition-all
        duration-300
        group
        cursor-pointer
        hover:shadow-xl
        hover:scale-105
        flex items-center gap-3
      `}
      tabIndex={0}
      aria-label={`Manager Rating: ${hasRatings ? managerRatings.latestRating + '/5' : 'No ratings yet'}`}
      title={`Manager Rating: ${hasRatings ? managerRatings.latestRating + '/5' : 'No ratings yet'}`}
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative flex items-center gap-3 w-full">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex-shrink-0">
          <BsPersonCheck className="w-4 h-4" />
        </div>

        {/* Value and Title */}
        <div className="flex flex-col">
          <div className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
            {hasRatings ? `${managerRatings.latestRating}/5` : '0'}
          </div>
          <div className="text-xs font-medium text-gray-400">
            Manager Rating
          </div>
        </div>
      </div>
    </motion.div>
  );
}

