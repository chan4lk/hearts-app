import { BsCalendar, BsEye, BsChevronRight, BsCheckCircle, BsXCircle, BsClock } from 'react-icons/bs';
import { Goal } from './types';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  return (
    <div
      className="bg-[#252832] rounded-xl p-5 border border-gray-800 hover:border-indigo-500/50 transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
          {goal.title}
          <BsChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${
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
          {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors">
        {goal.description}
      </p>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-2 bg-[#1E2028] px-3 py-1.5 rounded-lg">
          <BsCalendar className="w-4 h-4" />
          <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
        </div>
        <button
          className="flex items-center gap-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <BsEye className="w-4 h-4" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
} 