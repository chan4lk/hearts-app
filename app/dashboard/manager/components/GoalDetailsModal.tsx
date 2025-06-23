import { BsLightningCharge, BsPerson, BsCalendar, BsClock, BsX } from 'react-icons/bs';
import { Goal } from '../types';
import { getStatusStyle } from '../utils';
import { useEffect, useRef } from 'react';

interface GoalDetailsModalProps {
  goal: Goal | null;
  onClose: () => void;
}

export default function GoalDetailsModal({ goal, onClose }: GoalDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    // Auto close after 3 minutes of inactivity
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 180000);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      clearTimeout(autoCloseTimer);
    };
  }, [onClose]);

  if (!goal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 animate-in fade-in duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-tr from-blue-500/10 via-cyan-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div ref={modalRef} className="relative bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-xl rounded-xl w-full max-w-md border border-white/20 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="relative z-10 p-4">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg">
                  <BsLightningCharge className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white truncate">
                  {goal.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg border border-gray-600/30">
                <BsPerson className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-200 text-sm truncate">
                  {goal.employee?.name}
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-start gap-2">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium shadow-lg ${getStatusStyle(goal.status).bg} ${getStatusStyle(goal.status).text}`}>
                {getStatusStyle(goal.status).icon}
                <span className="ml-1">{goal.status.charAt(0)}</span>
              </span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <BsX className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white mb-1">Description</h3>
            <div className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/30">
              <p className="text-gray-200 text-sm line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                {goal.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/30">
              <div className="flex items-center gap-2 mb-1">
                <BsCalendar className="w-3 h-3 text-indigo-400" />
                <span className="text-gray-300 text-xs">Due Date</span>
              </div>
              <span className="text-white text-sm">
                {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            <div className="bg-gray-700/50 p-2 rounded-lg border border-gray-600/30">
              <div className="flex items-center gap-2 mb-1">
                <BsClock className="w-3 h-3 text-amber-400" />
                <span className="text-gray-300 text-xs">Submitted</span>
              </div>
              <span className="text-white text-sm">
                {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}