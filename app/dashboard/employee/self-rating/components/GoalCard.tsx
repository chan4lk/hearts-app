import { motion, AnimatePresence } from "framer-motion";
import { BsStarFill, BsChevronDown } from "react-icons/bs";
import { Label } from "@/components/ui/label";
import { GoalWithRating } from "../types";
import { useState } from "react";
import {
  RATING_COLORS,
  RATING_HOVER_COLORS,
  RATING_LABELS,
  RATING_DESCRIPTIONS,
  STATUS_COLORS
} from "../constants";

interface GoalCardProps {
  goal: GoalWithRating;
  submitting: Record<string, boolean>;
  handleSelfRating: (goalId: string, value: number) => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      mass: 0.5
    }
  }
};

const detailsVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { 
    height: "auto", 
    opacity: 1,
    transition: {
      height: {
        type: "spring",
        stiffness: 100,
        damping: 20
      },
      opacity: { duration: 0.2 }
    }
  }
};

export function GoalCard({ goal, submitting, handleSelfRating }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
    >
      {/* Status Indicator Line */}
      <div className={`absolute top-0 left-0 w-full h-0.5 ${
        STATUS_COLORS[goal.status as keyof typeof STATUS_COLORS].replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')
      }`} />

      {/* Main Content - Clickable Area */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">{goal.title}</h3>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                <BsChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {goal.description}
            </p>
          </div>
          <span className={`shrink-0 text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-medium ${
            STATUS_COLORS[goal.status as keyof typeof STATUS_COLORS]
          }`}>
            {goal.status}
          </span>
        </div>

        {/* Rating Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Self Rating</Label>
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelfRating(goal.id, rating)}
                  disabled={submitting[goal.id]}
                  className={`w-7 h-7 rounded transition-all duration-200 ${
                    goal.rating?.score === rating
                      ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  } ${RATING_HOVER_COLORS[rating as keyof typeof RATING_HOVER_COLORS]} hover:shadow-md flex items-center justify-center`}
                >
                  <BsStarFill className="w-3 h-3" />
                </motion.button>
              ))}
            </div>
          </div>

          {goal.rating?.score && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2 border-t border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start gap-2">
                <div className={`w-1 h-1 rounded-full mt-1.5 ${
                  RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS].replace('text-', 'bg-').replace('dark:text-', 'dark:bg-')
                }`} />
                <div>
                  <p className={`text-xs font-medium ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                    {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Expandable Details Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={detailsVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {goal.description}
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(goal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {goal.rating?.comments && (
                <div>
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Rating Comments</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {goal.rating.comments}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 