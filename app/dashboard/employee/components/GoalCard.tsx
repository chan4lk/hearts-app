import { motion } from 'framer-motion';
import { BsCalendar, BsTag, BsGear, BsXCircle, BsCheckCircle, BsClock } from 'react-icons/bs';
import { Goal } from './types';
import { IconType } from 'react-icons';
import { CATEGORIES } from '@/app/components/shared/constants';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  showActions?: boolean;
}

type StatusConfig = {
  bg: string;
  text: string;
  icon: IconType;
};

type StatusConfigs = {
  [key in 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MODIFIED' | 'PENDING']: StatusConfig;
};

export default function GoalCard({ goal, onClick, onEdit, onDelete, showActions = false }: GoalCardProps) {
  const getStatusConfig = (status: string): StatusConfig => {
    const configs: StatusConfigs = {
      APPROVED: { bg: 'from-emerald-500/10 to-emerald-500/20', text: 'text-emerald-300', icon: BsCheckCircle },
      REJECTED: { bg: 'from-red-500/10 to-red-500/20', text: 'text-red-300', icon: BsXCircle },
      COMPLETED: { bg: 'from-blue-500/10 to-blue-500/20', text: 'text-blue-300', icon: BsCheckCircle },
      MODIFIED: { bg: 'from-amber-500/10 to-amber-500/20', text: 'text-amber-300', icon: BsClock },
      PENDING: { bg: 'from-amber-500/10 to-amber-500/20', text: 'text-amber-300', icon: BsClock }
    };
    return configs[status as keyof StatusConfigs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(goal.status);
  const categoryConfig = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
  const Icon = categoryConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group relative overflow-hidden w-full text-left h-[200px]"
    >
      <div className={`relative h-full p-4 rounded-xl backdrop-blur-xl border border-white/10 transition-all duration-300
        ${categoryConfig.bgColor} ${categoryConfig.bgGradient}
        hover:shadow-2xl hover:shadow-purple-500/10`}
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
        
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3 mb-2">
            <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl
              ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
              group-hover:scale-110 group-hover:rotate-[10deg] flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-white group-hover:text-transparent 
                group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                transition-all duration-300 truncate">{goal.title}</h3>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1 flex-shrink-0`}>
              <statusConfig.icon className="w-3 h-3" />
              <span>{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <BsCalendar className="w-3 h-3" />
                <span>Due: {formatDate(goal.dueDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                <BsTag className="w-3 h-3" />
                <span>{goal.category}</span>
              </div>
            </div>

            {showActions && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(goal);
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10"
                    title="Edit Goal"
                  >
                    <BsGear className="w-4 h-4" />
                  </motion.button>
                )}
                {onDelete && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(goal.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
                    title="Delete Goal"
                  >
                    <BsXCircle className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
          bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
          bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
      </div>
    </motion.button>
  );
} 