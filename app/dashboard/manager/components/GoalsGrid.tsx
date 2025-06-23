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
      <div className="col-span-full relative bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-xl rounded-3xl p-12 text-center border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 to-gray-800/30 rounded-3xl"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm mb-6 border border-white/20 shadow-lg">
            <BsCheckCircle className="w-10 h-10 text-indigo-300" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No goals found</h3>
          <p className="text-gray-300 text-lg">
            There are no employee goals to review at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {goals.map((goal, index) => (
        <div 
          key={goal.id} 
          onClick={() => onGoalClick(goal)}
          className="group relative bg-gradient-to-br from-gray-800/80 to-gray-700/80 backdrop-blur-xl rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 border border-gray-600/30 hover:border-indigo-500/50 cursor-pointer hover:scale-105 animate-in slide-in-from-bottom-4"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Card Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                  <BsLightningCharge className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {goal.title}
                </h3>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm border border-gray-600/30 ${
                getStatusStyle(goal.status).bg
              } ${getStatusStyle(goal.status).text}`}>
                {getStatusStyle(goal.status).icon}
                <span className="ml-2">
                  {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                </span>
              </span>
            </div>

            <div className="mb-4">
              <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm p-3 rounded-xl border border-gray-600/30 flex items-center gap-3 group-hover:border-indigo-500/30 transition-colors">
                <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <BsPerson className="w-4 h-4 text-white" />
                </div>
                <span className="text-gray-200 font-medium">
                  {goal.employee?.name}
                </span>
              </div>
            </div>

            <p className="text-gray-300 mb-4 leading-relaxed">
              {goal.description}
            </p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-600/30">
                <BsCalendar className="w-4 h-4 text-indigo-400" />
                <span className="text-gray-200 font-medium">
                  Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-600/30">
                <BsClock className="w-4 h-4 text-purple-400" />
                <span className="text-gray-200 font-medium">
                  Submitted: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 