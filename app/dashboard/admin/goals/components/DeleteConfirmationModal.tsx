import { Goal } from '../types';
import { BsExclamationTriangle } from 'react-icons/bs';

interface DeleteConfirmationModalProps {
  goal: Goal;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({ goal, onClose, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-[#1E2028] rounded-lg p-6 w-full max-w-md mx-4 border border-gray-800">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <BsExclamationTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Delete Goal</h3>
          <p className="text-gray-400 mb-6">
            Are you sure you want to delete the goal "{goal.title}"? This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 