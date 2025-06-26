import { motion } from 'framer-motion';
import { BsPerson, BsCalendar, BsClock, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { Goal } from '../types';
import { CATEGORIES } from '@/app/components/shared/constants';

interface GoalCardProps {
  goal: Goal;
  onAction: (goal: Goal, action: 'approve' | 'reject', comment?: string) => void;
  onViewDetails: (goal: Goal) => void;
}

const STATUS_STYLES = {
  PENDING: {
    bg: 'from-amber-500/10 to-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    icon: BsClock
  },
  MODIFIED: {
    bg: 'from-blue-500/10 to-blue-500/20',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    icon: BsClock
  },
  APPROVED: {
    bg: 'from-emerald-500/10 to-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    icon: BsCheckCircle
  },
  REJECTED: {
    bg: 'from-red-500/10 to-red-500/20',
    text: 'text-red-300',
    border: 'border-red-500/30',
    icon: BsXCircle
  }
} as const;

const getCategoryConfig = (category: string) => {
  const categoryConfig = CATEGORIES.find(c => c.value === category);
  if (!categoryConfig) return CATEGORIES[0];
  return categoryConfig;
};

export default function GoalCard({ goal, onAction, onViewDetails }: GoalCardProps) {
  const categoryConfig = getCategoryConfig(goal.category);
  const Icon = categoryConfig.icon;
  const statusStyle = STATUS_STYLES[goal.status] || STATUS_STYLES.PENDING;
  const StatusIcon = statusStyle.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onViewDetails(goal)}
      className="group relative overflow-hidden w-full text-left h-[200px]"
    >
      <div className={`relative h-full p-4 rounded-xl backdrop-blur-xl border ${statusStyle.border} transition-all duration-300 bg-gradient-to-br ${statusStyle.bg} hover:shadow-2xl hover:shadow-purple-500/10`}>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />

        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl ring-1 ring-white/20 shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[10deg] flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300 line-clamp-1">
                {goal.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 truncate">
                  {goal.employee.name}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1 flex-shrink-0`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto">
            {goal.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <BsCalendar className="w-3 h-3 text-amber-500" />
                <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <BsClock className="w-3 h-3 text-emerald-500" />
                <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
      </div>
    </motion.div>
  );
} 