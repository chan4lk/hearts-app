import { BsLightningCharge, BsPerson, BsCalendar, BsClock, BsCheckCircle } from 'react-icons/bs';
import { Goal } from '../types';
import { getStatusStyle } from '../utils';

interface GoalsGridProps {
  goals: Goal[];
  activeTab: 'employee' | 'personal' | 'assigned';
  onGoalClick: (goal: Goal) => void;
}

export default function GoalsGrid({ goals, activeTab, onGoalClick }: GoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div className="col-span-full bg-[#1E2028] rounded-xl p-12 text-center border border-gray-800">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4 border border-gray-700">
          <BsCheckCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
        <p className="text-gray-400">
          There are no {activeTab === 'employee' ? 'employee' : activeTab === 'personal' ? 'personal' : 'assigned'} goals to review at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {goals.map((goal) => (
        <div 
          key={goal.id} 
          onClick={() => onGoalClick(goal)}
          className="bg-[#1E2028] rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <BsLightningCharge className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-medium text-indigo-400">
                {goal.title}
              </h3>
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm ${
              getStatusStyle(goal.status).bg
            } ${getStatusStyle(goal.status).text}`}>
              {getStatusStyle(goal.status).icon}
              <span className="ml-1">
                {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
              </span>
            </span>
          </div>

          {activeTab === 'employee' && (
            <div className="mb-4">
              <div className="bg-[#252832] p-1.5 rounded-lg flex items-center gap-2">
                <BsPerson className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  {goal.employee?.name}
                </span>
              </div>
            </div>
          )}

          <p className="text-gray-400 mb-4">
            {goal.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <BsCalendar className="w-4 h-4" />
              <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
              <BsClock className="w-4 h-4" />
              <span>Submitted: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 