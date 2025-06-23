import { BsLightningCharge, BsPerson, BsCalendar, BsClock, BsCheckCircle } from 'react-icons/bs';
import { Goal } from '../types';
import { getStatusStyle } from '../utils';

interface GoalsGridProps {
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
}

export default function GoalsGrid({ goals, onGoalClick }: GoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-700/50 mb-4">
          <BsCheckCircle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No goals found</h3>
        <p className="text-gray-400 text-sm">
          There are no employee goals to review at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {goals.map((goal, index) => (
        <div 
          key={goal.id} 
          onClick={() => onGoalClick(goal)}
          className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-gray-600/50 cursor-pointer transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2 min-w-0">
              <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md flex-shrink-0 mt-0.5">
                <BsLightningCharge className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                  {goal.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="p-1 bg-gray-700/50 rounded">
                    <BsPerson className="w-3 h-3 text-gray-400" />
                  </div>
                  <span className="text-xs text-gray-400 truncate">
                    {goal.employee?.name}
                  </span>
                </div>
              </div>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusStyle(goal.status).bg} ${getStatusStyle(goal.status).text} flex-shrink-0 ml-2`}>
              {getStatusStyle(goal.status).icon}
              <span className="ml-1">
                {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
              </span>
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {goal.description}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <BsCalendar className="w-3 h-3" />
              <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <BsClock className="w-3 h-3" />
              <span>Created: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 