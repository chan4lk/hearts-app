import { useState } from 'react';
import { BsX, BsCheckCircle, BsXCircle, BsClock, BsCalendar, BsShield } from 'react-icons/bs';
import { Goal } from './types';

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
  onSubmitGoal: (goalId: string) => Promise<void>;
}

export default function GoalDetailModal({ goal, onClose, onSubmitGoal }: GoalDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitGoal(goal.id);
      onClose();
    } catch (error) {
      console.error('Error submitting goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6" onClick={onClose}>
      <div className="bg-[#1E2028] rounded-xl p-5 w-full max-w-lg md:max-w-2xl mx-auto border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-5">
          <div>
            <span className={`px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5 mb-2 ${
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
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">{goal.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors active:scale-[0.98] ml-4"
          >
            <BsX className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-base font-medium text-white mb-1.5">Description</h3>
            <p className="text-gray-400 text-sm sm:text-base">{goal.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#252832] rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <BsCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">Due Date</span>
              </div>
              <p className="text-white text-sm sm:text-base">
                {new Date(goal.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-[#252832] rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <BsShield className="w-4 h-4" />
                <span className="text-sm font-medium">Assigned Manager</span>
              </div>
              <p className="text-white text-sm sm:text-base">{goal.manager?.name || 'Not assigned'}</p>
            </div>
          </div>

          {(goal.status === 'DRAFT' || goal.status === 'MODIFIED') && (
            <div className="bg-[#252832] rounded-lg p-4 border border-gray-700 mt-5">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <BsCheckCircle className="w-4 h-4" />
                    Submit for Approval
                  </>
                )}
              </button>
            </div>
          )}

          {(goal.status === 'APPROVED' || goal.status === 'REJECTED') && goal.managerComments && (
            <div className="bg-[#252832] rounded-lg p-4 border border-gray-700 mt-5">
              <div className="flex items-center gap-2 text-gray-400 mb-1.5">
                <span className="text-sm font-medium">Manager Feedback</span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base">{goal.managerComments}</p>
            </div>
          )}

          {goal.status === 'PENDING' && (
            <div className="flex items-center text-amber-400 mt-5 text-sm sm:text-base">
              <BsClock className="w-4 h-4 mr-2" />
              <span>Awaiting manager approval</span>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors active:scale-[0.98] text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}