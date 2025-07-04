import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BsLightningCharge, BsPerson, BsCalendar, BsClock, BsX, BsCheckCircle, BsXCircle, BsChat, BsPencil, BsTrash } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';

interface GoalDetailsModalProps {
  goal: Goal;
  onClose: () => void;
  onAction: (goal: Goal, action: 'approve' | 'reject', comment: string) => void;
}

export default function GoalDetailsModal({ goal, onClose, onAction }: GoalDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [comment, setComment] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const STATUS_STYLES = {
    PENDING: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      icon: <BsClock className="w-3 h-3" />
    },
    MODIFIED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      icon: <BsClock className="w-3 h-3" />
    },
    APPROVED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      icon: <BsCheckCircle className="w-3 h-3" />
    },
    REJECTED: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      icon: <BsXCircle className="w-3 h-3" />
    },
    COMPLETED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      icon: <BsCheckCircle className="w-3 h-3" />
    },
    DRAFT: {
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      icon: <BsPencil className="w-3 h-3" />
    },
    DELETED: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      icon: <BsTrash className="w-3 h-3" />
    }
  } as const;

  const handleActionClick = (action: 'approve' | 'reject') => {
    setActionType(action);
    setShowConfirmation(true);
  };

  const handleConfirmAction = async () => {
    if (!actionType) return;
    
    setIsSubmitting(true);
    try {
      await onAction(goal, actionType, comment);
      setShowConfirmation(false);
      setActionType(null);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error processing action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-tr from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="relative bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl rounded-2xl w-full max-w-xl border border-white/10 dark:border-gray-700/50 shadow-2xl overflow-hidden"
      >
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg shadow-lg"
                >
                  <BsLightningCharge className="w-4 h-4 text-white" />
                </motion.div>
                <h2 className="text-lg font-semibold text-white truncate">
                  {goal.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 bg-white/5 dark:bg-gray-700/20 p-2 rounded-lg backdrop-blur-sm">
                <BsPerson className="w-4 h-4 text-emerald-400" />
                <span className="text-white/90 text-sm truncate">
                  {goal.employee?.name}
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-start gap-2">
              <motion.span 
                whileHover={{ scale: 1.05 }}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${STATUS_STYLES[goal.status]?.bg} ${STATUS_STYLES[goal.status]?.text} backdrop-blur-sm`}
              >
                {STATUS_STYLES[goal.status]?.icon}
                <span className="ml-1">{goal.status}</span>
              </motion.span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <BsX className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-1">Description</h3>
            <div className="bg-white/5 dark:bg-gray-700/20 p-3 rounded-lg backdrop-blur-sm">
              <p className="text-white/80 text-sm whitespace-pre-wrap">
                {goal.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 dark:bg-gray-700/20 p-3 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <BsCalendar className="w-3 h-3 text-indigo-400" />
                <span className="text-white/60 text-xs">Due Date</span>
              </div>
              <span className="text-white/90 text-sm">
                {new Date(goal.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 dark:bg-gray-700/20 p-3 rounded-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <BsClock className="w-3 h-3 text-amber-400" />
                <span className="text-white/60 text-xs">Submitted</span>
              </div>
              <span className="text-white/90 text-sm">
                {new Date(goal.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </motion.div>
          </div>

          {/* Comment Section */}
          {showConfirmation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <BsChat className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-medium text-white/80">
                  Add a comment for {actionType === 'approve' ? 'approval' : 'rejection'}
                </h3>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Add your ${actionType === 'approve' ? 'approval' : 'rejection'} comment here...`}
                className="w-full px-3 py-2 text-sm bg-white/5 dark:bg-gray-700/20 border border-white/10 dark:border-gray-600/50 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent outline-none transition-all resize-none text-white/90 placeholder-white/40"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowConfirmation(false);
                    setActionType(null);
                    setComment('');
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmAction}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    actionType === 'approve'
                      ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white'
                      : 'bg-rose-500/80 hover:bg-rose-500 text-white'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processing...
                    </span>
                  ) : (
                    `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          {!showConfirmation && (
            <div className="flex gap-2 pt-3 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleActionClick('approve')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/80 text-emerald-400 hover:text-white rounded-lg transition-all text-sm font-medium backdrop-blur-sm"
              >
                <BsCheckCircle className="w-4 h-4" />
                Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleActionClick('reject')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/80 text-rose-400 hover:text-white rounded-lg transition-all text-sm font-medium backdrop-blur-sm"
              >
                <BsXCircle className="w-4 h-4" />
                Reject
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 