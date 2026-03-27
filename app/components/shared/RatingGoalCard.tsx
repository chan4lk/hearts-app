'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BsChevronDown, BsCalendar, BsStarFill } from 'react-icons/bs';
import { GoalWithRating, GoalWithRatingExtended } from '@/app/components/shared/types';
import { CATEGORIES, RATING_DESCRIPTIONS } from '@/app/components/shared/constants';
import { StatusBadge } from '@/app/components/shared/feedback';
import { useState } from 'react';

export type RatingGoalCardVariant = 'self' | 'manager';

type RatingGoal = GoalWithRating | GoalWithRatingExtended;

interface RatingGoalCardProps {
  goal: RatingGoal;
  onRatingChange: (goalId: string, value: number) => void;
  submitting?: boolean | Record<string, boolean>;
  variant?: RatingGoalCardVariant;
}

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
  return variant === 'manager' ? r.managerComments ?? null : r.selfComments ?? null;
}

export default function RatingGoalCard({
  goal,
  onRatingChange,
  submitting = false,
  variant = 'self',
}: RatingGoalCardProps) {
  const [showDetails, setShowDetails] = useState(variant === 'manager');
  const categoryConfig = CATEGORIES.find((c) => c.value === goal.category) ?? CATEGORIES[0];
  const Icon = categoryConfig.icon;
  const isSubmitting = getSubmitting(submitting, goal.id);
  const currentScore = getCurrentScore(goal, variant);
  const ratingLabel = getRatingLabel(goal, variant);
  const comments = getComments(goal, variant);
  const employeeName = 'employee' in goal && goal.employee ? goal.employee.name : null;
  const titleDisplay = variant === 'manager' && employeeName ? `${employeeName} — ${goal.title}` : goal.title;

  return (
    <div className="bg-surface-elevated border border-theme rounded-xl overflow-hidden hover:shadow-theme-sm transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-surface-secondary flex-shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-primary truncate">{titleDisplay}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge type="status" value={goal.status} size="sm" />
                {variant === 'manager' && (
                  <StatusBadge type="department" value={goal.category} size="sm" showIcon={false} />
                )}
                <span className="text-xs text-tertiary flex items-center gap-1">
                  <BsCalendar className="w-3 h-3" />
                  Due {new Date(goal.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-secondary p-1.5 rounded-lg hover:bg-surface-secondary focus-ring"
            aria-label={showDetails ? 'Collapse details' : 'Expand details'}
          >
            <motion.div animate={{ rotate: showDetails ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <BsChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-secondary mt-2 line-clamp-2">{goal.description}</p>

        {/* Rating Section */}
        <div className="mt-3 pt-3 border-t border-theme">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary">{ratingLabel}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => !isSubmitting && onRatingChange(goal.id, rating)}
                  disabled={isSubmitting}
                  aria-label={`Rate ${rating} out of 5`}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all focus-ring ${
                    currentScore != null && rating <= currentScore
                      ? 'bg-warning-muted text-warning'
                      : 'bg-surface-secondary text-tertiary hover:bg-surface-tertiary hover:text-warning'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <BsStarFill className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
          {currentScore != null && (
            <p className="text-xs text-secondary mt-1">
              {RATING_DESCRIPTIONS[currentScore as keyof typeof RATING_DESCRIPTIONS]}
            </p>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-theme bg-surface-secondary/50 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-tertiary">Category</span>
                  <p className="text-primary font-medium">{categoryConfig.label}</p>
                </div>
                <div>
                  <span className="text-tertiary">Created</span>
                  <p className="text-primary font-medium">{new Date(goal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {comments && (
                <div>
                  <span className="text-xs text-tertiary">Comments</span>
                  <p className="text-xs text-secondary mt-0.5">{comments}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
