import { BsLightningCharge, BsPerson, BsCalendar, BsClock, BsX } from 'react-icons/bs';
import { Goal } from '../types';
import { getStatusStyle } from '../utils';

interface GoalDetailsModalProps {
  goal: Goal | null;
  onClose: () => void;
}

export default function GoalDetailsModal({ goal, onClose }: GoalDetailsModalProps) {
  if (!goal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-300">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-tr from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl w-full max-w-lg sm:max-w-2xl border border-white/20 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        {/* Modal Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl sm:rounded-3xl"></div>
        
        <div className="relative z-10 p-4 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg sm:rounded-xl shadow-lg">
                  <BsLightningCharge className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
                  {goal.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl border border-gray-600/30">
                <div className="p-1 sm:p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-md sm:rounded-lg">
                  <BsPerson className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-gray-200 font-medium text-sm sm:text-lg truncate">
                  {goal.employee?.name}
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium shadow-lg backdrop-blur-sm border border-gray-600/30 ml-2 flex-shrink-0 ${
              getStatusStyle(goal.status).bg
            } ${getStatusStyle(goal.status).text}`}>
              {getStatusStyle(goal.status).icon}
              <span className="ml-1 sm:ml-2 hidden sm:inline">
                {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
              </span>
              <span className="ml-1 sm:hidden">
                {goal.status.charAt(0)}
              </span>
            </span>
          </div>

          {/* Description */}
          <div className="mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-lg font-semibold text-white mb-2 sm:mb-3">Description</h3>
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-600/30">
              <p className="text-gray-200 leading-relaxed text-sm sm:text-base">
                {goal.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-600/30">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1 sm:p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md sm:rounded-lg">
                  <BsCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-gray-300 font-medium text-xs sm:text-sm">Due Date</span>
              </div>
              <span className="text-white font-semibold text-sm sm:text-base">
                {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/50 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-600/30">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="p-1 sm:p-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-md sm:rounded-lg">
                  <BsClock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="text-gray-300 font-medium text-xs sm:text-sm">Submitted</span>
              </div>
              <span className="text-white font-semibold text-sm sm:text-base">
                {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="group px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-lg sm:rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/20 border border-gray-600/30 hover:border-gray-500/50 flex items-center gap-2 text-sm sm:text-base"
            >
              <BsX className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}