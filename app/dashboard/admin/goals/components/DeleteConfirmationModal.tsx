import { Goal } from '../types';
import { Button } from '@/components/ui/button';
import { BsXCircle } from 'react-icons/bs';

interface DeleteConfirmationModalProps {
  goal: Goal;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({ goal, onClose, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <div className="bg-[#1E2028] rounded-lg p-6 w-full max-w-md mx-4 border border-gray-800 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-rose-500/10">
          <BsXCircle className="w-6 h-6 text-rose-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Delete Goal</h2>
      </div>
      
      <p className="text-gray-300 mb-6">
        Are you sure you want to delete the goal "{goal.title}"? This action cannot be undone.
      </p>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
        >
          Delete
        </Button>
      </div>
    </div>
  );
} 