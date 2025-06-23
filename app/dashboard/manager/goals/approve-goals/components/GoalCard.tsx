import { motion } from 'framer-motion';
import { BsPerson, BsCalendar, BsClock, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onAction: (goal: Goal, action: 'approve' | 'reject', comment?: string) => void;
  onViewDetails: (goal: Goal) => void;
}

const STATUS_STYLES = {
  PENDING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: <BsClock className="w-3 h-3" />
  },
  MODIFIED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: <BsClock className="w-3 h-3" />
  },
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: <BsCheckCircle className="w-3 h-3" />
  },
  REJECTED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: <BsXCircle className="w-3 h-3" />
  }
} as const;

export default function GoalCard({ goal, onAction, onViewDetails }: GoalCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onViewDetails(goal)}
      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Status Badge */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${STATUS_STYLES[goal.status]?.bg || 'bg-gray-500/10'} ${STATUS_STYLES[goal.status]?.text || 'text-gray-600 dark:text-gray-400'}`}>
        {STATUS_STYLES[goal.status]?.icon}
        <span>{goal.status.charAt(0)}</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Employee */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {goal.title}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-sm mt-1">
            <BsPerson className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{goal.employee.name}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {goal.description}
        </p>

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 pt-2">
          <div className="flex items-center gap-1">
            <BsCalendar className="w-3 h-3 text-amber-500" />
            <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <BsClock className="w-3 h-3 text-emerald-500" />
            <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAction(goal, 'approve', '');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all text-xs font-medium"
          >
            <BsCheckCircle className="w-3.5 h-3.5" />
            Approve
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onAction(goal, 'reject', '');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all text-xs font-medium"
          >
            <BsXCircle className="w-3.5 h-3.5" />
            Reject
          </motion.button>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
} 