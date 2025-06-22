import { BsCalendar, BsEye, BsChevronRight, BsCheckCircle, BsXCircle, BsClock } from 'react-icons/bs';
import { Goal } from './types';
import { IconType } from 'react-icons';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

type StatusConfig = {
  bgColor: string;
  textColor: string;
  icon: IconType;
};

type StatusConfigs = {
  [key in 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MODIFIED' | 'PENDING']: StatusConfig;
};

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  const getStatusConfig = (status: string): StatusConfig => {
    const configs: StatusConfigs = {
      APPROVED: { bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-400', icon: BsCheckCircle },
      REJECTED: { bgColor: 'bg-rose-500/10', textColor: 'text-rose-400', icon: BsXCircle },
      COMPLETED: { bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', icon: BsCheckCircle },
      MODIFIED: { bgColor: 'bg-amber-500/10', textColor: 'text-amber-400', icon: BsClock },
      PENDING: { bgColor: 'bg-amber-500/10', textColor: 'text-amber-400', icon: BsClock }
    };
    return configs[status as keyof StatusConfigs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(goal.status);

  return (
    <div
      onClick={onClick}
      className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-lg p-3 
                 border border-gray-800/50 hover:border-indigo-500/30 transition-all duration-300 group 
                 cursor-pointer active:scale-[0.98] overflow-hidden"
    >
      {/* Hover Effect Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 
                    group-hover:from-indigo-500/3 group-hover:via-indigo-500/5 group-hover:to-indigo-500/3 
                    transition-all duration-500" />

      <div className="relative">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-medium text-gray-200 group-hover:text-indigo-300 transition-colors line-clamp-1 flex-1">
            {goal.title}
          </h3>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] ${statusConfig.bgColor} ${statusConfig.textColor}`}>
            <statusConfig.icon className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
            <span className="sm:hidden">{goal.status.charAt(0)}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2 mb-2 group-hover:text-gray-300 transition-colors">
          {goal.description}
        </p>

        {/* Footer Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded text-[10px]">
            <BsCalendar className="w-2.5 h-2.5 text-gray-400" />
            <span className="text-gray-400">{new Date(goal.dueDate).toLocaleDateString()}</span>
          </div>
          
          {/* View Details Button - Always Visible on Mobile, Hover on Desktop */}
          <button
            className="flex items-center gap-1.5 text-indigo-400/80 hover:text-indigo-300 
                       sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 text-[10px]"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <BsEye className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Details</span>
          </button>
        </div>

        {/* Right Arrow Indicator */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-2 opacity-0 group-hover:opacity-100 
                      transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <BsChevronRight className="w-3 h-3 text-indigo-400/60" />
        </div>
      </div>
    </div>
  );
} 