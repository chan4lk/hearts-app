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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onViewRatings}
      className="group relative bg-gray-900/90 rounded-xl overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute inset-0 border border-white/10 group-hover:border-amber-500/20 rounded-xl transition-colors"></div>
      <div className="relative p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="bg-amber-500/10 p-2 rounded-lg group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
            <BsPersonCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full group-hover:bg-amber-500/20 transition-colors">
            Manager Rating
          </span>
        </div>
        <div>
          {hasRatings ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${ratingColor} transition-colors`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < (managerRatings.latestRating || 0) ? (
                        <BsStarFill className="w-3 h-3" />
                      ) : (
                        <BsStar className="w-3 h-3 opacity-30" />
                      )}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold text-white">
                  {managerRatings.latestRating}/5
                </span>
              </div>
              <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                {RATING_LABELS[managerRatings.latestRating as keyof typeof RATING_LABELS] || 'Not Rated'}
              </div>
              <div className="flex items-center gap-1 text-xs mt-1">
                <span className="text-amber-400 font-medium">{managerRatings.rated}/{managerRatings.total}</span>
                <span className="text-gray-400 group-hover:text-gray-300">goals rated</span>
                {managerRatings.average > 0 && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="text-amber-400 font-medium">Avg: {managerRatings.average}</span>
                  </>
                )}
              </div>
              {managerRatings.latestComment && (
                <div className="mt-2 text-xs text-gray-400 italic line-clamp-2 group-hover:text-gray-300 transition-colors">
                  "{managerRatings.latestComment}"
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-200 transition-colors">
                No Ratings Yet
              </h3>
              <div className="flex items-center gap-1 text-xs mt-0.5">
                <span className="text-gray-400 group-hover:text-gray-300">
                  Waiting for manager feedback
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

