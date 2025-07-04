'use client';

import { Button } from '@/app/components/ui/button';
import { BsExclamationTriangle } from 'react-icons/bs';

interface DeleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteGoalModal({
  isOpen,
  onClose,
  onConfirm
}: DeleteGoalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-[#1E2028] border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-start gap-4">
          <div className="bg-rose-500/10 p-2 rounded-lg">
            <BsExclamationTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Delete Goal</h3>
            <p className="text-gray-400 mt-2">
              Are you sure you want to delete this goal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-transparent border-gray-700 hover:bg-gray-700/50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 