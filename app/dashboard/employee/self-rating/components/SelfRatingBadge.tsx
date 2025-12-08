'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BsStar, BsStarFill, BsTrophy, BsArrowRight, BsEye } from 'react-icons/bs';
import { RATING_COLORS, RATING_LABELS } from '@/app/components/shared/constants';
import { useSession } from 'next-auth/react';

interface SelfRatingBadgeProps {
  goals: any[];
  onViewRatings?: () => void;
}

export default function SelfRatingBadge({ goals, onViewRatings }: SelfRatingBadgeProps) {
  const { data: session } = useSession();
  const [selfRatings, setSelfRatings] = useState<{
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
    // Filter goals that have self ratings
    const ratedGoals = goals.filter(goal => goal.rating?.selfScore || goal.rating?.score);
    
    if (ratedGoals.length === 0) {
      setSelfRatings({
        total: goals.length,
        rated: 0,
        average: 0,
        latestRating: null,
        latestComment: null
      });
      return;
    }

    // Calculate statistics
    const ratings = ratedGoals.map(goal => goal.rating?.selfScore || goal.rating?.score).filter(Boolean);
    const average = ratings.length > 0 
      ? Math.round((ratings.reduce((sum: number, score: number) => sum + score, 0) / ratings.length) * 10) / 10
      : 0;

    // Get latest rating (most recent selfRatedAt)
    const latestGoal = ratedGoals.reduce((latest, current) => {
      const latestDate = latest.rating?.selfRatedAt 
        ? new Date(latest.rating.selfRatedAt).getTime() 
        : 0;
      const currentDate = current.rating?.selfRatedAt 
        ? new Date(current.rating.selfRatedAt).getTime() 
        : 0;
      return currentDate > latestDate ? current : latest;
    }, ratedGoals[0]);

    setSelfRatings({
      total: goals.length,
      rated: ratedGoals.length,
      average,
      latestRating: latestGoal.rating?.selfScore || latestGoal.rating?.score || null,
      latestComment: latestGoal.rating?.selfComments || latestGoal.rating?.comments || null
    });
  }, [goals]);

  const hasRatings = selfRatings.rated > 0;
  const ratingColor = selfRatings.latestRating 
    ? RATING_COLORS[selfRatings.latestRating as keyof typeof RATING_COLORS]
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
        bg-yellow-500/15
        backdrop-blur-sm
        rounded-xl
        p-3
        border-2
        border-yellow-500/50
        hover:border-yellow-500/80
        hover:bg-yellow-500/20
        transition-all
        duration-300
        group
        cursor-pointer
        shadow-lg
        shadow-yellow-500/10
        hover:shadow-xl
        hover:shadow-yellow-500/30
        hover:scale-105
        flex items-center gap-3
        focus:outline-none
        focus:ring-2
        focus:ring-yellow-500/50
        focus:ring-offset-2
        focus:ring-offset-gray-900
        ring-1
        ring-yellow-500/20
      `}
      tabIndex={0}
      role="button"
      aria-label={`Self Rating: ${hasRatings ? selfRatings.latestRating + '/5' : 'No ratings yet'}. Click to view all ratings.`}
      title="Click to view all self ratings"
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-15 transition-opacity duration-300"></div>

      {/* Click indicator badge - Always visible */}
      <div className="absolute top-1.5 right-1.5">
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/30 backdrop-blur-sm rounded-md border border-yellow-500/50 group-hover:bg-yellow-500/40 group-hover:border-yellow-500/70 transition-all duration-300">
          <BsEye className="w-2.5 h-2.5 text-yellow-200" />
          <span className="text-[10px] font-semibold text-yellow-200">View</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-3 w-full">
        {/* Icon - Trophy with Star */}
        <div className="relative p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
          {hasRatings ? (
            <BsTrophy className="w-4 h-4" />
          ) : (
            <BsStar className="w-4 h-4" />
          )}
        </div>

        {/* Value and Title */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent group-hover:from-yellow-300 group-hover:to-orange-300 transition-all duration-300">
            {hasRatings ? `${selfRatings.latestRating}/5` : '0'}
          </div>
          <div className="text-xs font-medium text-yellow-300/80 group-hover:text-yellow-300 transition-colors duration-300">
            Self Rating
          </div>
          {hasRatings && selfRatings.rated > 0 && (
            <div className="text-[10px] text-yellow-400/70 group-hover:text-yellow-400 mt-0.5 transition-colors duration-300">
              {selfRatings.rated} rated
            </div>
          )}
        </div>

        {/* Clickable icon indicator - Always visible */}
        <div className="flex-shrink-0">
          <div className="p-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/40 group-hover:bg-yellow-500/30 group-hover:border-yellow-500/60 transition-all duration-300">
            <BsArrowRight className="w-3.5 h-3.5 text-yellow-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

