import { useState } from 'react';
import { BsX, BsCheckCircle, BsXCircle, BsClock, BsCalendar, BsShield, BsChat } from 'react-icons/bs';
import { Goal } from './types';

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
  onSubmitGoal: (goalId: string, comment: string) => Promise<void>;
}

export default function GoalDetailModal({ goal, onClose, onSubmitGoal }: GoalDetailModalProps) {
  const [submissionComment, setSubmissionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitGoal(goal.id, submissionComment);
      setSubmissionComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-2 mb-3 ${
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
            <h2 className="text-2xl font-bold text-white">{goal.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <BsX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Description</h3>
            <p className="text-gray-400">{goal.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#252832] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <BsCalendar className="w-4 h-4" />
                <span className="text-sm font-medium">Due Date</span>
              </div>
              <p className="text-white">
                {new Date(goal.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-[#252832] rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <BsShield className="w-4 h-4" />
                <span className="text-sm font-medium">Assigned Manager</span>
              </div>
              <p className="text-white">{goal.manager?.name || 'Not assigned'}</p>
            </div>
          </div>

          {(goal.status === 'DRAFT' || goal.status === 'MODIFIED') && (
            <div className="bg-[#252832] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <BsChat className="w-4 h-4" />
                <span className="text-sm font-medium">Submit for Approval</span>
              </div>
              <textarea
                value={submissionComment}
                onChange={(e) => setSubmissionComment(e.target.value)}
                placeholder="Add any comments for your manager (optional)"
                className="w-full bg-[#1E2028] text-white rounded-lg p-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mt-2 mb-3"
                rows={3}
              />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="bg-[#252832] rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <BsChat className="w-4 h-4" />
                <span className="text-sm font-medium">Manager Feedback</span>
              </div>
              <p className="text-gray-300">{goal.managerComments}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            {goal.status === 'PENDING' && (
              <div className="flex-1 text-amber-400 flex items-center">
                <BsClock className="w-4 h-4 mr-2" />
                Awaiting manager approval
              </div>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 