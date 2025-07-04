import { motion, AnimatePresence } from "framer-motion";
import { BsChevronDown, BsCalendar, BsTag, BsStarFill } from "react-icons/bs";
import { Label } from "@/app/components/ui/label";
import { GoalWithRating } from "../types";
import { useState, useEffect } from "react";
import { CATEGORIES } from '@/app/components/shared/constants';
import { RATING_COLORS, RATING_LABELS, RATING_DESCRIPTIONS } from "../constants/ratings";

type CategoryType = typeof CATEGORIES[0];
type ViewMode = 'grid' | 'list';

interface GoalCardProps {
  goal: GoalWithRating;
  submitting: boolean;
  onRatingChange: (goalId: string, value: number) => void;
  viewMode?: ViewMode;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function GoalCard({ goal, submitting, onRatingChange, viewMode = 'list' }: GoalCardProps) {
  const [showDetails, setShowDetails] = useState(true);
  const categoryConfig = CATEGORIES.find(c => c.value === goal.category) ?? CATEGORIES[0];
  const Icon = categoryConfig.icon;
  const isGridView = viewMode === 'grid';

  // Reset showDetails to true when viewMode changes
  useEffect(() => {
    setShowDetails(true);
  }, [viewMode]);

  return (
    <motion.div
      variants={itemVariants}
      className={`w-full rounded-xl shadow-sm overflow-hidden group ${
        isGridView 
          ? `h-[280px] flex flex-col relative ${categoryConfig.bgColor} hover:shadow-xl hover:shadow-${categoryConfig.iconColor}/10 transition-all duration-300` 
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      {/* Grid View Background Effects */}
      {isGridView && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${categoryConfig.color}`} />
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
        </>
      )}

      {/* Main Card Content */}
      <div className={`relative p-4 ${isGridView ? 'flex-1 flex flex-col z-10' : ''}`}>
        {/* Header */}
        <div className={`flex items-start justify-between gap-4 ${isGridView ? 'mb-3' : ''}`}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl
              ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
              ${isGridView ? 'group-hover:scale-110 group-hover:rotate-[10deg]' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-medium truncate ${
                  isGridView 
                    ? 'text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {goal.employee.name} - {goal.title}
                </h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap
                  ${isGridView ? 'bg-white/20 text-white' : categoryConfig.iconColor + ' bg-opacity-20'}`}>
                  {categoryConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full
                  ${goal.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                  goal.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                  goal.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'}`}>
                  {goal.status}
                </span>
                <span className={`text-xs ${isGridView ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  {goal.employee.email}
                </span>
                <span className={`text-xs ${isGridView ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                  Due {new Date(goal.dueDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {!isGridView && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-400 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <motion.div
                animate={{ rotate: showDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <BsChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          )}
        </div>

        {/* Description */}
        <p className={`text-sm line-clamp-2 ${
          isGridView 
            ? 'mb-4 flex-1 text-white/80' 
            : 'mt-3 text-gray-600 dark:text-gray-300'
        }`}>
          {goal.description}
        </p>

        {/* Rating Section */}
        <div className={`${isGridView ? 'pt-4' : 'mt-4 pt-4'} border-t ${
          isGridView ? 'border-white/10' : 'border-gray-100 dark:border-gray-700'
        }`}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className={`text-sm ${
                isGridView ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {goal.rating?.score ? 'Your Rating' : 'Rate Progress'}
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => !submitting && onRatingChange(goal.id, rating)}
                    disabled={submitting}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      isGridView
                        ? goal.rating?.score === rating
                          ? 'bg-white/20 text-yellow-300'
                          : 'bg-white/5 text-white/40 hover:bg-white/10'
                        : goal.rating?.score === rating
                          ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <BsStarFill className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            
            {goal.rating?.score && (
              <div className={`text-sm ${
                isGridView ? 'text-white/70' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
              </div>
            )}
          </div>
        </div>

        {/* Grid View Additional Info */}
        {isGridView && (
          <div className="mt-3 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <BsCalendar className="w-3 h-3" />
              <span>Created {new Date(goal.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BsTag className="w-3 h-3" />
              <span className="font-medium">{categoryConfig.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details - Only in List View */}
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
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Details</h4>
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

                  {goal.rating?.comments && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Comments</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {goal.rating.comments}
                      </p>
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