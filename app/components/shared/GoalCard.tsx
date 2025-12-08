import { motion } from 'framer-motion';
import { BsCalendar, BsTag, BsGear, BsXCircle, BsCheckCircle, BsClock, BsPencil, BsTrash, BsPerson, BsBarChart, BsPlayCircle, BsPauseCircle, BsFlag, BsCircle } from 'react-icons/bs';
import { Goal, ProgressStatus } from '@/app/components/shared/types';
import { IconType } from 'react-icons';
import { CATEGORIES } from '@/app/components/shared/constants';
import { Progress } from '@/app/components/ui/progress';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  showActions?: boolean;
  showEmployee?: boolean; // Show employee name for manager/admin views
}

type StatusConfig = {
  bg: string;
  text: string;
  icon: IconType;
  border?: string;
  label?: string;
};

type StatusConfigs = {
  [key in 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MODIFIED' | 'PENDING' | 'DRAFT' | 'DELETED']: StatusConfig;
};

// Progress status display configuration
const PROGRESS_STATUS_CONFIG: Record<ProgressStatus, { label: string; color: string; icon: IconType }> = {
  'NOT_STARTED': { label: 'Not Started', color: 'text-gray-400', icon: BsCircle },
  'IN_PROGRESS': { label: 'In Progress', color: 'text-blue-400', icon: BsPlayCircle },
  'ON_HOLD': { label: 'On Hold', color: 'text-amber-400', icon: BsPauseCircle },
  'BLOCKED': { label: 'Blocked', color: 'text-red-400', icon: BsFlag },
  'COMPLETED': { label: 'Completed', color: 'text-green-400', icon: BsCheckCircle },
};

export default function GoalCard({ 
  goal, 
  onClick, 
  onEdit, 
  onDelete, 
  showActions = false,
  showEmployee = false 
}: GoalCardProps) {
  const getStatusConfig = (status: string): StatusConfig => {
    const configs: StatusConfigs = {
      APPROVED: { 
        bg: 'from-emerald-500/10 to-emerald-500/20', 
        text: 'text-emerald-300', 
        icon: BsCheckCircle,
        border: 'border-emerald-500/30'
      },
      REJECTED: { 
        bg: 'from-red-500/10 to-red-500/20', 
        text: 'text-red-300', 
        icon: BsXCircle,
        border: 'border-red-500/30'
      },
      COMPLETED: { 
        bg: 'from-blue-500/10 to-blue-500/20', 
        text: 'text-blue-300', 
        icon: BsCheckCircle,
        border: 'border-blue-500/30'
      },
      MODIFIED: { 
        bg: 'from-amber-500/10 to-amber-500/20', 
        text: 'text-amber-300', 
        icon: BsClock,
        border: 'border-amber-500/30'
      },
      PENDING: { 
        bg: 'from-amber-500/10 to-amber-500/20', 
        text: 'text-amber-300', 
        icon: BsClock,
        border: 'border-amber-500/30'
      },
      DRAFT: {
        bg: 'from-gray-500/10 to-gray-500/20',
        text: 'text-gray-300',
        icon: BsPencil,
        border: 'border-gray-500/30'
      },
      DELETED: {
        bg: 'from-red-900/10 to-red-900/20',
        text: 'text-red-300',
        icon: BsTrash,
        border: 'border-red-900/30'
      }
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

  // Get employee name
  const getEmployeeName = () => {
    if (goal.employee) {
      if (typeof goal.employee === 'object' && 'name' in goal.employee) {
        return goal.employee.name;
      }
    }
    return 'Unknown Employee';
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
      <div className={`relative h-full p-4 rounded-xl backdrop-blur-xl border transition-all duration-300
        ${statusConfig.border || 'border-white/10'}
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
              
              {/* Show employee name for manager/admin views */}
              {showEmployee && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                  <BsPerson className="w-3 h-3" />
                  <span>{getEmployeeName()}</span>
                </div>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1 flex-shrink-0`}>
              <statusConfig.icon className="w-3 h-3" />
              <span>{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

          {/* Progress Bar and Status for DRAFT, PENDING, and APPROVED goals */}
          {['DRAFT', 'PENDING', 'APPROVED'].includes(goal.status) && (
            <div className="mt-2 mb-2">
              <div className="flex items-center justify-between mb-1">
                {/* Progress Status Label */}
                {(() => {
                  const progressStatusKey = (goal.progressStatus || 'NOT_STARTED') as ProgressStatus;
                  const statusConfig = PROGRESS_STATUS_CONFIG[progressStatusKey];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div className={`flex items-center gap-1.5 text-xs ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </div>
                  );
                })()}
                <span className={`text-xs font-medium ${
                  (goal.progress || 0) === 100 ? 'text-green-400' :
                  (goal.progress || 0) >= 75 ? 'text-blue-400' :
                  (goal.progress || 0) >= 50 ? 'text-amber-400' :
                  (goal.progress || 0) >= 25 ? 'text-orange-400' :
                  'text-gray-400'
                }`}>
                  {goal.progress || 0}%
                </span>
              </div>
              <Progress
                value={goal.progress || 0}
                className="h-1.5"
              />
            </div>
          )}

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
                      onDelete(goal);
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

