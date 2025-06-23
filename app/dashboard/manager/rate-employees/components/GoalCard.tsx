import { motion } from "framer-motion";
import { BsCalendar, BsStarFill } from "react-icons/bs";
import { Label } from "@/components/ui/label";
import { GoalWithRating } from "../types";
import { RATING_COLORS, RATING_HOVER_COLORS, RATING_LABELS, RATING_DESCRIPTIONS } from "../constants/ratings";

interface GoalCardProps {
  goal: GoalWithRating;
  submitting: boolean;
  onRatingChange: (goalId: string, value: number) => void;
}

export default function GoalCard({ goal, submitting, onRatingChange }: GoalCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.01 }}
      className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl 
                 border border-white/20 dark:border-gray-700/30 hover:border-violet-500/30 
                 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg"
    >
      <div className="p-4 space-y-3">
        {/* Header with Employee Info and Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 
                         flex items-center justify-center ring-2 ring-white/90 dark:ring-gray-800"
            >
              <span className="text-white font-medium text-sm">{goal.employee.name[0]}</span>
            </motion.div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 
                           dark:group-hover:text-violet-400 transition-colors line-clamp-1"
              >
                {goal.employee.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{goal.employee.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-100/50 
                         dark:bg-gray-700/50 rounded-full px-2 py-1">
            <BsCalendar className="w-3 h-3" />
            <span className="text-xs">{new Date(goal.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Goal Content */}
        <div className="space-y-2 px-2">
          <h4 className="text-base font-medium text-gray-800 dark:text-white group-hover:text-violet-600 
                       dark:group-hover:text-violet-400 transition-colors line-clamp-1"
          >
            {goal.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {goal.description}
          </p>
        </div>

        {/* Rating Section */}
        <div className="space-y-3 pt-3 border-t border-gray-200/30 dark:border-gray-600/30">
          <div className="flex items-center justify-between px-2">
            <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">Rating</Label>
            {goal.rating?.score && (
              <motion.span 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}
              >
                {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((rating) => (
              <motion.button
                key={rating}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => !submitting && onRatingChange(goal.id, rating)}
                disabled={submitting}
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 
                           transition-all duration-200 cursor-pointer select-none
                           ${goal.rating?.score === rating
                             ? `${RATING_COLORS[rating as keyof typeof RATING_COLORS]} shadow-md`
                             : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                           } ${submitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
              >
                <BsStarFill className={`w-3.5 h-3.5 ${
                  goal.rating?.score === rating 
                    ? 'text-current' 
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-violet-500'
                }`} />
                <span className={`text-[10px] font-medium ${
                  goal.rating?.score === rating 
                    ? 'text-current' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>{rating}</span>
              </motion.button>
            ))}
          </div>

          {goal.rating?.score && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-gray-50/30 to-gray-100/30 
                         dark:from-gray-700/30 dark:to-gray-800/30 border border-gray-200/30 
                         dark:border-gray-600/30"
            >
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {RATING_DESCRIPTIONS[goal.rating.score as keyof typeof RATING_DESCRIPTIONS]}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-indigo-500/5 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
} 