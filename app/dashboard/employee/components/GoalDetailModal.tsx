import { useState, useRef, useEffect } from 'react';
import { BsX, BsCheckCircle, BsXCircle, BsClock, BsCalendar, BsShield, BsChat, BsArrowRight, BsChevronDown, BsChevronUp } from 'react-icons/bs';
import { Goal } from './types';
import { IconType } from 'react-icons';
import { showToast } from '@/app/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalDetailModalProps {
  goal: Goal;
  onClose: () => void;
  onSubmitGoal: (goalId: string) => Promise<void>;
}

type StatusConfig = {
  bgColor: string;
  textColor: string;
  icon: IconType;
  label: string;
};

export default function GoalDetailModal({ goal, onClose, onSubmitGoal }: GoalDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState<number>(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    // Check if description content height exceeds the collapsed height
    const checkDescriptionHeight = () => {
      if (descriptionRef.current) {
        const scrollHeight = descriptionRef.current.scrollHeight;
        setExpandedHeight(scrollHeight);
        const isContentTall = scrollHeight > 100; // 100px is our collapsed height
        setShouldShowExpandButton(isContentTall);
      }
    };

    checkDescriptionHeight();
    window.addEventListener('resize', checkDescriptionHeight);
    
    return () => {
      window.removeEventListener('resize', checkDescriptionHeight);
    };
  }, [goal.description]);

  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      APPROVED: { bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400', icon: BsCheckCircle, label: 'Approved' },
      REJECTED: { bgColor: 'bg-rose-500/20', textColor: 'text-rose-400', icon: BsXCircle, label: 'Rejected' },
      COMPLETED: { bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', icon: BsCheckCircle, label: 'Completed' },
      MODIFIED: { bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', icon: BsClock, label: 'Modified' },
      PENDING: { bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', icon: BsClock, label: 'Pending' }
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(goal.status);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmitGoal(goal.id);
      showToast.goal.updated();
      onClose();
    } catch (error) {
      showToast.goal.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to submit goal. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting) {
      showToast.error(
        'Action in Progress', 
        'Please wait for the current action to complete'
      );
      return;
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-3 backdrop-blur-sm"
    >
      <motion.div 
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl w-full max-w-md mx-auto 
                   shadow-2xl overflow-hidden transform transition-all"
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="relative px-4 py-3 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.textColor} mb-2`}
            >
              <statusConfig.icon className="w-3 h-3" />
              <span>{statusConfig.label}</span>
            </motion.div>
            <h2 className="text-base font-medium text-white truncate pr-8">{goal.title}</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full -mr-1"
          >
            <BsX className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 space-y-3 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* Description Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3.5"
          >
            <div className="relative">
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  !isDescriptionExpanded ? 'overflow-hidden' : ''
                }`}
                style={{
                  maxHeight: isDescriptionExpanded ? `${expandedHeight}px` : '100px'
                }}
              >
                <p 
                  ref={descriptionRef}
                  className="text-sm text-white/90 leading-relaxed"
                >
                  {goal.description}
                </p>
              </div>
              
              {/* Gradient Fade Effect */}
              {!isDescriptionExpanded && shouldShowExpandButton && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"
                />
              )}
              
              {/* Show More/Less Button */}
              {shouldShowExpandButton && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center justify-center w-full gap-1.5 mt-2 py-2 text-xs font-medium
                           text-gray-400 hover:text-white transition-colors rounded-lg
                           hover:bg-white/5 active:bg-white/10"
                >
                  <span>{isDescriptionExpanded ? 'Show Less' : 'Show More'}</span>
                  <BsChevronDown 
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isDescriptionExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>
          </motion.div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                <BsCalendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Due Date</span>
              </div>
              <p className="text-sm text-white/90">{new Date(goal.dueDate).toLocaleDateString()}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                <BsShield className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Manager</span>
              </div>
              <p className="text-sm text-white/90 truncate">{goal.manager?.name || 'Not assigned'}</p>
            </motion.div>
          </div>

          {/* Manager Feedback */}
          <AnimatePresence>
            {(goal.status === 'APPROVED' || goal.status === 'REJECTED') && goal.managerComments && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-300">
                    <BsChat className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Manager's Decision</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    goal.status === 'APPROVED' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {goal.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : ''}
                </div>
                <div className="bg-black/20 rounded-xl p-3 mt-2">
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{goal.managerComments}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Status */}
          <AnimatePresence>
            {goal.status === 'PENDING' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 
                          text-sm p-3 rounded-2xl"
              >
                <BsClock className="w-3.5 h-3.5 mr-2 animate-pulse" />
                <span>Awaiting manager approval</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative px-4 pb-4 pt-2">
          <div className="flex justify-end gap-2">
            {(goal.status === 'DRAFT' || goal.status === 'MODIFIED') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 text-white rounded-xl 
                         hover:bg-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm group"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <BsArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}