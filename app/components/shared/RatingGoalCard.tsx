'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BsChevronDown, BsCalendar, BsTag, BsStarFill } from 'react-icons/bs';
import { Label } from '@/app/components/ui/label';
import { GoalWithRating, GoalWithRatingExtended } from '@/app/components/shared/types';
import { CATEGORIES, RATING_DESCRIPTIONS } from '@/app/components/shared/constants';
import { useState, useEffect } from 'react';

export type RatingGoalCardViewMode = 'grid' | 'list';
export type RatingGoalCardVariant = 'self' | 'manager';

type RatingGoal = GoalWithRating | GoalWithRatingExtended;

interface RatingGoalCardProps {
  goal: RatingGoal;
  onRatingChange: (goalId: string, value: number) => void;
  /** Whether this card (or goal) is submitting. Can be a boolean or a map goalId -> boolean */
  submitting?: boolean | Record<string, boolean>;
  viewMode?: RatingGoalCardViewMode;
  variant?: RatingGoalCardVariant;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function getSubmitting(submitting: boolean | Record<string, boolean> | undefined, goalId: string): boolean {
  if (submitting === undefined) return false;
  if (typeof submitting === 'boolean') return submitting;
  return !!submitting[goalId];
}

function getCurrentScore(goal: RatingGoal, variant: RatingGoalCardVariant): number | undefined {
  const r = goal.rating;
  if (!r) return undefined;
  if (variant === 'manager') return r.managerScore ?? (r as any).score;
  return r.selfScore ?? (r as any).score;
}

function getRatingLabel(goal: RatingGoal, variant: RatingGoalCardVariant): string {
  const score = getCurrentScore(goal, variant);
  if (variant === 'manager') return score != null ? 'Your Rating' : 'Rate Progress';
  return score != null ? 'Your Rating' : 'Rate Your Progress';
}

function getComments(goal: RatingGoal, variant: RatingGoalCardVariant): string | null {
  const r = goal.rating;
  if (!r) return null;
  if (variant === 'manager') return r.managerComments ?? (r as any).comments ?? null;
  return (r as any).comments ?? null;
}

export default function RatingGoalCard({
  goal,
  onRatingChange,
  submitting = false,
  viewMode = 'list',
  variant = 'self',
}: RatingGoalCardProps) {
  const [showDetails, setShowDetails] = useState(variant === 'manager');
  const categoryConfig = CATEGORIES.find((c) => c.value === goal.category) ?? CATEGORIES[0];
  const Icon = categoryConfig.icon;
  const isGridView = viewMode === 'grid';
  const isSubmitting = getSubmitting(submitting, goal.id);
  const currentScore = getCurrentScore(goal, variant);
  const ratingLabel = getRatingLabel(goal, variant);
  const comments = getComments(goal, variant);
  const employeeName = 'employee' in goal && goal.employee ? goal.employee.name : null;

  useEffect(() => {
    if (variant === 'manager') setShowDetails(true);
  }, [variant]);

  const titleDisplay = variant === 'manager' && employeeName ? `${employeeName} - ${goal.title}` : goal.title;

  return (
    <motion.div
      variants={itemVariants}
      className={`w-full rounded-xl shadow-sm overflow-hidden group ${
        isGridView
          ? `h-[280px] flex flex-col relative ${categoryConfig.bgColor} hover:shadow-xl transition-all duration-300`
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      {isGridView && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${categoryConfig.color}`} />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
        </>
      )}

      <div className={`relative p-4 ${isGridView ? 'flex-1 flex flex-col z-10' : ''}`}>
        <div className={`flex items-start justify-between gap-4 ${isGridView ? 'mb-3' : ''}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl ring-1 ring-white/20 transform transition-transform duration-300 ${
                isGridView ? 'group-hover:scale-110 group-hover:rotate-[10deg]' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-base font-medium truncate ${
                    isGridView
                      ? 'text-white group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70'
                      : 'text-primary'
                  }`}
                >
                  {titleDisplay}
                </h3>
                {variant === 'manager' && (
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                      isGridView ? 'bg-white/20 text-white' : `${categoryConfig.iconColor} bg-opacity-20`
                    }`}
                  >
                    {categoryConfig.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    goal.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : goal.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                        : goal.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                  }`}
                >
                  {goal.status}
                </span>
                {variant === 'manager' && 'employee' in goal && goal.employee?.email && (
                  <span className={`text-xs ${isGridView ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                    {goal.employee.email}
                  </span>
                )}
                <span className={`text-xs ${isGridView ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  Due {new Date(goal.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {!isGridView && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <motion.div animate={{ rotate: showDetails ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <BsChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          )}
        </div>

        <p
          className={`text-sm line-clamp-2 ${
            isGridView ? 'mb-4 flex-1 text-white/80' : 'mt-3 text-gray-600 dark:text-gray-300'
          }`}
        >
          {goal.description}
        </p>

        <div
          className={`${isGridView ? 'pt-4' : 'mt-4 pt-4'} border-t ${
            isGridView ? 'border-white/10' : 'border-gray-100 dark:border-gray-700'
          }`}
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label
                className={`text-sm ${isGridView ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'}`}
              >
                {ratingLabel}
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => !isSubmitting && onRatingChange(goal.id, rating)}
                    disabled={isSubmitting}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      isGridView
                        ? currentScore === rating
                          ? 'bg-white/20 text-yellow-300'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                        : currentScore === rating
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <BsStarFill className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            {currentScore != null && (
              <div
                className={`text-sm ${
                  isGridView ? 'text-white/70' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {RATING_DESCRIPTIONS[currentScore as keyof typeof RATING_DESCRIPTIONS]}
              </div>
            )}
          </div>
        </div>

        {isGridView && (
          <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <BsCalendar className="w-3 h-3" />
              <span>Created {new Date(goal.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BsTag className="w-3 h-3" />
              <span>{variant === 'manager' ? categoryConfig.label : goal.category}</span>
            </div>
          </div>
        )}
      </div>

      {!isGridView && (
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-1">Details</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <BsCalendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          Created on {new Date(goal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BsTag className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {categoryConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  {comments && (
                    <div>
                      <h4 className="text-sm font-medium text-primary mb-1">Comments</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{comments}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
