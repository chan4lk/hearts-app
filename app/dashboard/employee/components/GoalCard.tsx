import { BsCalendar, BsEye, BsChevronRight, BsCheckCircle, BsXCircle, BsClock } from 'react-icons/bs';
import { Goal } from './types';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  return (
    <div
      className="bg-[#252832] rounded-xl p-4 sm:p-5 border border-gray-800 hover:border-indigo-500/50 transition-all group cursor-pointer active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
          {goal.title}
          <BsChevronRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
        </h3>
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs flex items-center gap-1.5 ${
          goal.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
          goal.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
          goal.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
          goal.status === 'MODIFIED' ? 'bg-amber-500/10 text-amber-400' :
          'bg-amber-500/10 text-amber-400'
        }`}>
          {goal.status === 'APPROVED' && <BsCheckCircle className="w-3 h-3" />}
          {goal.status === 'REJECTED' && <BsXCircle className="w-3 h-3" />}
          {goal.status === 'COMPLETED' && <BsCheckCircle className="w-3 h-3" />}
          {goal.status === 'MODIFIED' && <BsClock className="w-3 h-3" />}
          {goal.status === 'PENDING' && <BsClock className="w-3 h-3" />}
          <span className="hidden sm:inline">{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
          <span className="sm:hidden">{goal.status.charAt(0)}</span>
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-3 sm:mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors">
        {goal.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-[#1E2028] px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm">
          <BsCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <span className="text-gray-400">Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
        </div>
        <button
          className="flex items-center gap-1.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <BsEye className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">View Details</span>
          <span className="sm:hidden">View</span>
        </button>
      </div>
    </div>
  );
} 