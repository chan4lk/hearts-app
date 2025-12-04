'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BsStar, BsStarFill, BsPersonCheck, BsArrowRight, BsEye } from 'react-icons/bs';
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewRatings?.();
        }
      }}
      className={`
        relative overflow-hidden
        bg-amber-500/10
        backdrop-blur-sm
        rounded-xl
        p-3
        border-2
        border-amber-500/30
        hover:border-amber-500/60
        hover:bg-amber-500/15
        transition-all
        duration-300
        group
        cursor-pointer
        hover:shadow-xl
        hover:shadow-amber-500/20
        hover:scale-105
        flex items-center gap-3
        focus:outline-none
        focus:ring-2
        focus:ring-amber-500/50
        focus:ring-offset-2
        focus:ring-offset-gray-900
      `}
      tabIndex={0}
      role="button"
      aria-label={`Manager Rating: ${hasRatings ? managerRatings.latestRating + '/5' : 'No ratings yet'}. Click to view all ratings.`}
      title="Click to view all manager ratings"
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 group-hover:opacity-15 transition-opacity duration-300"></div>

      {/* Click indicator badge */}
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 backdrop-blur-sm rounded-md border border-amber-500/30">
          <BsEye className="w-2.5 h-2.5 text-amber-300" />
          <span className="text-[10px] font-semibold text-amber-300">View</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-3 w-full">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          <BsPersonCheck className="w-4 h-4" />
        </div>

        {/* Value and Title */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent group-hover:from-amber-300 group-hover:to-orange-300 transition-all duration-300">
            {hasRatings ? `${managerRatings.latestRating}/5` : '0'}
          </div>
          <div className="text-xs font-medium text-gray-400 group-hover:text-amber-300 transition-colors duration-300">
            Manager Rating
          </div>
          {hasRatings && managerRatings.rated > 0 && (
            <div className="text-[10px] text-gray-500 group-hover:text-amber-400/70 mt-0.5 transition-colors duration-300">
              {managerRatings.rated} rated
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        <div className="opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300 flex-shrink-0">
          <BsArrowRight className="w-4 h-4 text-amber-400" />
        </div>
      </div>
    </motion.div>
  );
}

