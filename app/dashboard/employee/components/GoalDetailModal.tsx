import { useState, useRef, useEffect } from 'react';
import { BsX, BsCheckCircle, BsXCircle, BsClock, BsCalendar, BsShield, BsChat, BsArrowRight, BsChevronDown, BsChevronUp, BsPencil, BsTrash, BsPerson, BsGear, BsFlag, BsBuilding } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { IconType } from 'react-icons';
import { showToast } from '@/app/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';

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

const getPriorityConfig = (priority: string) => {
  const configs: Record<string, { color: string; bg: string; icon: IconType; label: string }> = {
    HIGH: { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: BsFlag, label: 'High' },
    MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: BsFlag, label: 'Medium' },
    LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: BsFlag, label: 'Low' }
  };
  return configs[priority] || configs.MEDIUM;
};

const getDepartmentConfig = (department: string) => {
  const configs: Record<string, { color: string; bg: string; icon: IconType; label: string }> = {
    ENGINEERING: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: BsGear, label: 'Engineering' },
    MARKETING: { color: 'text-purple-400', bg: 'bg-purple-500/10', icon: BsBuilding, label: 'Marketing' },
    SALES: { color: 'text-green-400', bg: 'bg-green-500/10', icon: BsBuilding, label: 'Sales' },
    HR: { color: 'text-pink-400', bg: 'bg-pink-500/10', icon: BsPerson, label: 'HR' },
    FINANCE: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: BsBuilding, label: 'Finance' }
  };
  return configs[department] || configs.ENGINEERING;
};

export default function GoalDetailModal({ goal, onClose, onSubmitGoal }: GoalDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
        const isContentTall = scrollHeight > 80; // Reduced for mobile
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
      PENDING: { bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', icon: BsClock, label: 'Pending' },
      DRAFT: { bgColor: 'bg-gray-500/20', textColor: 'text-gray-400', icon: BsGear, label: 'Draft' }
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(goal.status);
  const priorityConfig = getPriorityConfig(goal.priority || 'MEDIUM');
  const departmentConfig = getDepartmentConfig(goal.department || 'ENGINEERING');

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

  const handleEdit = () => {
    // Toggle edit mode or implement edit functionality
    console.log('Edit goal:', goal.id);
  };

  const handleDelete = () => {
    // Implement delete functionality
    console.log('Delete goal:', goal.id);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
              <div className="fixed inset-0 flex items-center justify-center p-1 sm:p-2 md:p-3 z-50" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl md:rounded-3xl w-full max-w-[95vw] sm:max-w-md mx-auto 
                     shadow-2xl overflow-hidden transform transition-all max-h-[90vh] sm:max-h-[85vh] flex flex-col"
         >

                      {/* Decorative Elements */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-16 -right-16 w-32 h-32 sm:w-48 sm:h-48 bg-indigo-500/10 rounded-full"></div>
                <div className="absolute -bottom-16 -left-16 w-32 h-32 sm:w-48 sm:h-48 bg-purple-500/10 rounded-full"></div>
              </div>

        {/* Header */}
        <div className="relative px-3 sm:px-4 py-2.5 sm:py-3 flex items-start justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                <statusConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${priorityConfig.bg} ${priorityConfig.color} border-0`}>
                <priorityConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {priorityConfig.label}
              </Badge>
              <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${departmentConfig.bg} ${departmentConfig.color} border-0`}>
                <departmentConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {departmentConfig.label}
              </Badge>
            </div>
            <h2 className="text-sm sm:text-base font-medium text-white truncate pr-10 sm:pr-12 leading-tight">{goal.title}</h2>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400 hover:text-white hover:bg-white/10 touch-manipulation"
            >
              <BsX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
          {/* Description Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5"
          >
            <div className="relative">
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  !isDescriptionExpanded ? 'overflow-hidden' : ''
                }`}
                style={{
                  maxHeight: isDescriptionExpanded ? `${expandedHeight}px` : '60px'
                }}
              >
                <p 
                  ref={descriptionRef}
                  className="text-xs sm:text-sm text-white/90 leading-relaxed"
                >
                  {goal.description}
                </p>
              </div>
              
              {/* Gradient Fade Effect */}
              {!isDescriptionExpanded && shouldShowExpandButton && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 md:h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"
                />
              )}
              
              {/* Show More/Less Button */}
              {shouldShowExpandButton && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center justify-center w-full gap-1.5 mt-1.5 sm:mt-2 py-1.5 sm:py-2 text-xs font-medium
                           text-gray-400 hover:text-white transition-colors rounded-lg
                           hover:bg-white/5 active:bg-white/10 touch-manipulation min-h-[32px] sm:min-h-[36px]"
                >
                  <span>{isDescriptionExpanded ? 'Show Less' : 'Show More'}</span>
                  <BsChevronDown 
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ${
                      isDescriptionExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>
          </motion.div>

          {/* Progress Bar */}
          {goal.progress !== undefined && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5 sm:mb-2">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <Progress value={goal.progress} className="h-1.5 sm:h-2" />
            </motion.div>
          )}

          {/* Info Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300 mb-1 sm:mb-1.5">
                <BsCalendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Due Date</span>
              </div>
              <p className="text-xs sm:text-sm text-white/90">{new Date(goal.dueDate).toLocaleDateString()}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300 mb-1 sm:mb-1.5">
                <BsShield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Manager</span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 truncate">{goal.manager?.name || 'Not assigned'}</p>
            </motion.div>
          </div>

          {/* Additional Info - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300 mb-1 sm:mb-1.5">
                <BsPerson className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Employee</span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 truncate">{goal.employee?.name || 'Unassigned'}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300 mb-1 sm:mb-1.5">
                <BsGear className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Created</span>
              </div>
              <p className="text-xs sm:text-sm text-white/90">{new Date(goal.createdAt).toLocaleDateString()}</p>
            </motion.div>
          </div>

          {/* Manager Feedback */}
          <AnimatePresence>
            {(goal.status === 'APPROVED' || goal.status === 'REJECTED') && goal.managerComments && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5 space-y-1.5 sm:space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-300">
                    <BsChat className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium">Manager's Decision</span>
                  </div>
                  <Badge className={`text-[10px] sm:text-xs px-1.5 py-0.5 ${
                    goal.status === 'APPROVED' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-rose-500/20 text-rose-400'
                  } border-0`}>
                    {goal.status}
                  </Badge>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400">
                  {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : ''}
                </div>
                <div className="bg-black/20 rounded-lg sm:rounded-xl p-2 sm:p-3 mt-1.5 sm:mt-2">
                  <p className="text-xs sm:text-sm text-white/90 whitespace-pre-wrap">{goal.managerComments}</p>
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
                          text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg sm:rounded-xl md:rounded-2xl min-h-[40px] sm:min-h-[44px]"
              >
                <BsClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 animate-pulse flex-shrink-0" />
                <span>Awaiting manager approval</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex-shrink-0">
          <div className="flex justify-end gap-2">
            {(goal.status === 'DRAFT' || goal.status === 'MODIFIED') && (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 h-9 sm:h-10 touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <BsArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-gray-400 hover:text-white hover:bg-white/10 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 h-9 sm:h-10 touch-manipulation"
            >
              Close
            </Button>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  );
}