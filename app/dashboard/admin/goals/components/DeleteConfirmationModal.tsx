import { Goal } from '@/app/components/shared/types';
import { BsExclamationTriangle, BsTrash, BsX } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmationModalProps {
  goal: Goal;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmationModal({ goal, onClose, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gradient-to-b from-[#1E2028] to-[#171821] rounded-xl p-4 w-full max-w-sm shadow-2xl border border-white/5"
      >
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <BsX className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
              <BsTrash className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white">Delete Goal</h3>
              <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{goal.title}</p>
            </div>
          </div>

          <p className="text-[13px] text-gray-400 mb-4 bg-gray-900/50 p-2.5 rounded-lg border border-rose-500/10">
            This action cannot be undone. The goal will be permanently deleted from the system.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors border border-gray-700/50"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              className="flex-1 px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white text-sm rounded-lg transition-all border border-rose-500/20 hover:border-rose-500/50"
            >
              Delete Goal
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 