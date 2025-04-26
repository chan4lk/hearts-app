import { BsLightningCharge, BsPerson, BsCalendar, BsClock } from 'react-icons/bs';
import { Goal } from '../types';
import { getStatusStyle } from '../utils';

interface GoalDetailsModalProps {
  goal: Goal | null;
  onClose: () => void;
  activeTab: 'employee' | 'personal';
}

export default function GoalDetailsModal({ goal, onClose, activeTab }: GoalDetailsModalProps) {
  if (!goal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2028] rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BsLightningCharge className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-medium text-indigo-400">
                  {goal.title}
                </h2>
              </div>
              {activeTab === 'employee' && (
                <div className="flex items-center gap-2">
                  <BsPerson className="w-5 h-5 text-indigo-400" />
                  <span className="text-indigo-400 text-lg">
                    {goal.employee?.name}
                  </span>
                </div>
              )}
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

          <p className="text-gray-400 mb-6">
            {goal.description || 'No description provided'}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <BsCalendar className="w-4 h-4" />
              <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <BsClock className="w-4 h-4" />
              <span>Submitted: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 