import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BsX, BsCheckCircle, BsXCircle, BsClock, BsCalendar, BsShield, BsChat, BsArrowRight, BsChevronDown, BsChevronUp, BsPencil, BsTrash, BsPerson, BsGear, BsFlag, BsPlayCircle, BsPauseCircle, BsCircle, BsArrowRepeat } from 'react-icons/bs';
import { Goal, GoalWithRatingExtended } from '@/app/components/shared/types';
import { IconType } from 'react-icons';
import { getPriorityConfig as getSharedPriorityConfig, getDepartmentConfig as getSharedDepartmentConfig } from '@/app/utils/badgeConfigs';
import { motion, AnimatePresence } from 'framer-motion';
import { FORM_STYLES } from '@/app/components/ui/form-primitives';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import AIGoalRiskAnalysis from '@/app/components/ai/AIGoalRiskAnalysis';
import GoalActivityTimeline from '@/app/components/goals/GoalActivityTimeline';
import { useSession } from 'next-auth/react';

interface Activity {
  id: string;
  type: 'created' | 'progress_update' | 'status_change' | 'comment' | 'completed';
  timestamp: Date;
  user: {
    name: string;
    role: string;
  };
  data: {
    progress?: number;
    previousProgress?: number;
    status?: string;
    previousStatus?: string;
    notes?: string;
    comment?: string;
  };
}

interface GoalDetailModalProps {
  goal: Goal | GoalWithRatingExtended;
  onClose: () => void;
  onSubmitGoal?: (goalId: string) => Promise<void>;
  onEdit?: (goal: Goal | GoalWithRatingExtended) => void;
  onDelete?: (goal: Goal | GoalWithRatingExtended) => void;
}

type StatusConfig = {
  bgColor: string;
  textColor: string;
  icon: IconType;
  label: string;
};


// Use centralized configs — adapters to keep the local API shape
const getPriorityConfig = (priority: string) => {
  const c = getSharedPriorityConfig(priority);
  return { color: c.text, bg: c.bg, icon: c.icon, label: c.label };
};

const getDepartmentConfig = (department: string) => {
  return getSharedDepartmentConfig(department);
};

export default function GoalDetailModal({ goal, onClose, onSubmitGoal, onEdit, onDelete }: GoalDetailModalProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState<number>(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentGoal, setCurrentGoal] = useState<Goal>(goal);

  // Check if user is manager or admin
  const isManagerOrAdmin = session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN';
  
  // Update currentGoal when goal prop changes
  useEffect(() => {
    setCurrentGoal(goal);
  }, [goal]);

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

  // Fetch activity timeline
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/goals/${goal.id}/activity`);
        const data = await response.json();
        if (data.success) {
          setActivities(data.activities);
        }
      } catch {
        // Activity fetch is non-critical — fail silently without blocking UI
      }
    };

    if (goal.id) {
      fetchActivities();
    }
  }, [goal.id]);


  // Uses semantic color system — no hardcoded Tailwind colors
  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      APPROVED:    { bgColor: 'bg-success-muted', textColor: 'text-success', icon: BsCheckCircle, label: 'Approved' },
      REJECTED:    { bgColor: 'bg-error-muted',   textColor: 'text-error',   icon: BsXCircle,     label: 'Rejected' },
      COMPLETED:   { bgColor: 'bg-info-muted',    textColor: 'text-info',    icon: BsCheckCircle, label: 'Completed' },
      IN_PROGRESS: { bgColor: 'bg-info-muted',    textColor: 'text-info',    icon: BsPlayCircle,  label: 'In Progress' },
      ON_HOLD:     { bgColor: 'bg-warning-muted',  textColor: 'text-warning', icon: BsPauseCircle, label: 'On Hold' },
      BLOCKED:     { bgColor: 'bg-error-muted',   textColor: 'text-error',   icon: BsFlag,        label: 'Blocked' },
      MODIFIED:    { bgColor: 'bg-warning-muted',  textColor: 'text-warning', icon: BsClock,       label: 'Modified' },
      PENDING:     { bgColor: 'bg-warning-muted',  textColor: 'text-warning', icon: BsClock,       label: 'Pending' },
      DRAFT:       { bgColor: 'bg-surface-secondary', textColor: 'text-secondary', icon: BsGear,   label: 'Draft' }
    };
    return configs[status] || configs.PENDING;
  };

  const handleQuickStatusUpdate = async (newStatus: string) => {
    if (isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/goals/${goal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const data = await response.json();
      const updatedGoal = data.goal || data;
      
      // Update local goal state
      setCurrentGoal({ ...currentGoal, status: updatedGoal.status });
      
      // Toast removed
      
      // Refresh activities
      const activityResponse = await fetch(`/api/goals/${currentGoal.id}/activity`);
      const activityData = await activityResponse.json();
      if (activityData.success) {
        setActivities(activityData.activities);
      }
      
      // Close modal after status change so parent re-fetches
      if (newStatus === 'APPROVED' || newStatus === 'REJECTED') {
        setTimeout(() => onClose(), 300);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update status');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusConfig = getStatusConfig(currentGoal.status);
  const priorityConfig = getPriorityConfig(currentGoal.priority || 'MEDIUM');
  const departmentConfig = getDepartmentConfig(currentGoal.department || 'ENGINEERING');

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting || !onSubmitGoal) return null;

    try {
      setIsSubmitting(true);
      await onSubmitGoal(goal.id);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit goal');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSubmitting) {
      return; // Action in progress
    }
    setErrorMessage(null);
    onClose();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(goal);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(goal);
      onClose();
    }
  };

  const content = (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 modal-overlay z-[100]"
      />
              <div className="fixed inset-0 flex items-center justify-center p-1 sm:p-2 md:p-3 z-[100]" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative modal-content rounded-2xl w-full max-w-[95vw] sm:max-w-md mx-auto
                     shadow-theme-xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
         >
        {/* Header */}
        <div className="relative px-4 sm:px-5 py-3 sm:py-4 flex items-start justify-between flex-shrink-0 border-b border-theme">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              {/* Status Dropdown - Show for employees on PENDING/APPROVED goals, or managers/admins on any goal */}
              {((currentGoal.status === 'PENDING' || currentGoal.status === 'APPROVED') && session?.user?.id === currentGoal.employeeId) || 
               (isManagerOrAdmin && (currentGoal.status === 'PENDING' || currentGoal.status === 'DRAFT' || currentGoal.status === 'APPROVED')) ? (
                <Select
                  value={currentGoal.status}
                  onValueChange={handleQuickStatusUpdate}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className={`text-2xs sm:text-xs px-2 py-1 h-auto ${statusConfig.bgColor} ${statusConfig.textColor} border-0 hover:opacity-80 transition-opacity`}>
                    <div className="flex items-center gap-1">
                      <statusConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <SelectValue>{statusConfig.label}</SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-surface-elevated border-theme">
                    {session?.user?.id === currentGoal.employeeId ? (
                      // Employee can update to work statuses
                      <>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </>
                    ) : (
                      // Manager/Admin can approve/reject
                      <>
                        {currentGoal.status === 'PENDING' || currentGoal.status === 'DRAFT' ? (
                          <>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="ON_HOLD">On Hold</SelectItem>
                            <SelectItem value="BLOCKED">Blocked</SelectItem>
                          </>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`text-2xs sm:text-xs px-1.5 py-0.5 ${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                  <statusConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              )}
              <Badge className={`text-2xs sm:text-xs px-1.5 py-0.5 ${priorityConfig.bg} ${priorityConfig.color} border-0`}>
                <priorityConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {priorityConfig.label}
              </Badge>
              <Badge className={`text-2xs sm:text-xs px-1.5 py-0.5 ${departmentConfig.bg} ${departmentConfig.color} border-0`}>
                <departmentConfig.icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                {departmentConfig.label}
              </Badge>
            </div>
            <h2 className="text-sm sm:text-base font-medium text-primary truncate pr-10 sm:pr-12 leading-tight">{currentGoal.title}</h2>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSubmitting || isUpdatingStatus}
              aria-label="Close"
              className="h-7 w-7 sm:h-8 sm:w-8 text-secondary hover:text-primary hover:bg-surface-tertiary touch-manipulation"
            >
              <BsX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-3 sm:mx-4 mb-2 rounded-lg bg-error-muted border border-[rgb(var(--color-error))]/20 px-3 py-2 text-sm text-error"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3 flex-1 overflow-y-auto overscroll-contain">
          {/* Description Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-secondary rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5"
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
                  className="text-xs sm:text-sm text-primary leading-relaxed"
                >
                  {currentGoal.description}
                </p>
              </div>
              
              {/* Gradient Fade Effect */}
              {!isDescriptionExpanded && shouldShowExpandButton && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-6 sm:h-8 md:h-12 bg-gradient-to-t from-[rgb(var(--color-bg-secondary))] to-transparent pointer-events-none"
                />
              )}
              
              {/* Show More/Less Button */}
              {shouldShowExpandButton && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="flex items-center justify-center w-full gap-1.5 mt-1.5 sm:mt-2 py-1.5 sm:py-2 text-xs font-medium
                           text-secondary hover:text-primary transition-colors rounded-lg
                           hover:bg-surface-secondary active:bg-white/10 touch-manipulation min-h-[32px] sm:min-h-[36px]"
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

          
          {/* Info Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface-secondary rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-secondary mb-1 sm:mb-1.5">
                <BsCalendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Due Date</span>
              </div>
              <p className="text-xs sm:text-sm text-primary">{new Date(goal.dueDate).toLocaleDateString()}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface-secondary rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-secondary mb-1 sm:mb-1.5">
                <BsShield className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Manager</span>
              </div>
              <p className="text-xs sm:text-sm text-primary truncate">{goal.manager?.name || 'Not assigned'}</p>
            </motion.div>
          </div>

          {/* Additional Info - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-secondary rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-secondary mb-1 sm:mb-1.5">
                <BsPerson className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Employee</span>
              </div>
              <p className="text-xs sm:text-sm text-primary truncate">{goal.employee?.name || 'Unassigned'}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-secondary rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 text-secondary mb-1 sm:mb-1.5">
                <BsGear className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium">Created</span>
              </div>
              <p className="text-xs sm:text-sm text-primary">{new Date(goal.createdAt).toLocaleDateString()}</p>
            </motion.div>
          </div>

          {/* Manager Feedback */}
          <AnimatePresence>
            {(currentGoal.status === 'APPROVED' || currentGoal.status === 'REJECTED') && currentGoal.managerComments && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-surface-secondary rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-3.5 space-y-1.5 sm:space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-secondary">
                    <BsChat className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium">Manager's Decision</span>
                  </div>
                  <Badge className={`text-2xs sm:text-xs px-1.5 py-0.5 ${
                    currentGoal.status === 'APPROVED'
                      ? 'bg-success-muted text-success'
                      : 'bg-error-muted text-error'
                  } border-0`}>
                    {currentGoal.status}
                  </Badge>
                </div>
                <div className="text-2xs sm:text-xs text-tertiary">
                  {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : ''}
                </div>
                <div className="bg-surface-tertiary rounded-lg sm:rounded-xl p-2 sm:p-3 mt-1.5 sm:mt-2">
                  <p className="text-xs sm:text-sm text-primary whitespace-pre-wrap">{goal.managerComments}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Draft Status (Employee self-created) */}
          <AnimatePresence>
            {currentGoal.status === 'DRAFT' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center bg-gradient-to-r from-[rgb(var(--color-warning))]/20 to-[rgba(var(--color-warning),0.2)] text-warning
                          text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg sm:rounded-xl md:rounded-2xl min-h-[40px] sm:min-h-[44px]"
              >
                <BsClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 animate-pulse flex-shrink-0" />
                <span>Draft - Submit for manager review</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Status Update for Pending/Approved Goals (Employee Only) */}
          {(currentGoal.status === 'APPROVED' || currentGoal.status === 'PENDING') && session?.user?.id === currentGoal.employeeId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[rgba(var(--color-info),0.2)] via-[rgba(var(--color-accent),0.2)]/20 to-[rgba(var(--color-cat-technical),0.2)] backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-[rgba(var(--color-info),0.2)]"
            >
              <h4 className="text-xs sm:text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <BsPlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-info" />
                Update Status
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  onClick={() => handleQuickStatusUpdate('IN_PROGRESS')}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="flex items-center gap-2 bg-info-muted text-info border-[rgba(var(--color-info),0.2)] hover:opacity-80 text-xs"
                >
                  {isUpdatingStatus ? (
                    <BsArrowRepeat className="w-3 h-3 animate-spin" />
                  ) : (
                    <BsPlayCircle className="w-3 h-3" />
                  )}
                  In Progress
                </Button>
                <Button
                  onClick={() => handleQuickStatusUpdate('ON_HOLD')}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="flex items-center gap-2 bg-warning-muted text-warning border-[rgba(var(--color-warning),0.2)] hover:opacity-80 text-xs"
                >
                  {isUpdatingStatus ? (
                    <BsArrowRepeat className="w-3 h-3 animate-spin" />
                  ) : (
                    <BsPauseCircle className="w-3 h-3" />
                  )}
                  On Hold
                </Button>
                <Button
                  onClick={() => handleQuickStatusUpdate('BLOCKED')}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="flex items-center gap-2 bg-error-muted text-error border-[rgba(var(--color-error),0.2)] hover:opacity-80 text-xs"
                >
                  {isUpdatingStatus ? (
                    <BsArrowRepeat className="w-3 h-3 animate-spin" />
                  ) : (
                    <BsFlag className="w-3 h-3" />
                  )}
                  Blocked
                </Button>
                <Button
                  onClick={() => handleQuickStatusUpdate('COMPLETED')}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className="flex items-center gap-2 bg-success-muted text-success border-[rgba(var(--color-success),0.2)] hover:opacity-80 text-xs"
                >
                  {isUpdatingStatus ? (
                    <BsArrowRepeat className="w-3 h-3 animate-spin" />
                  ) : (
                    <BsCheckCircle className="w-3 h-3" />
                  )}
                  Completed
                </Button>
              </div>
            </motion.div>
          )}

          {/* AI Risk Analysis Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[rgba(var(--color-rating-2),0.2)] via-[rgba(var(--color-error),0.2)] to-[rgba(var(--color-error),0.2)] backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-[rgba(var(--color-rating-2),0.2)]"
          >
            <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <BsShield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rating-2" />
              AI Risk Analysis
            </h4>
            <AIGoalRiskAnalysis goalId={goal.id} />
          </motion.div>


          {/* Activity Timeline Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-secondary rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-theme"
          >
            <GoalActivityTimeline activities={activities} />
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative px-3 sm:px-4 pb-3 sm:pb-4 pt-2 flex-shrink-0">
          <div className="flex justify-end gap-2">
            {/* Edit Button - Show if onEdit is provided and:
                - For employees: goal is DRAFT/PENDING
                - For managers/admins: always show (they can edit team goals) */}
            {onEdit && (
              (currentGoal.status === 'DRAFT' || currentGoal.status === 'PENDING') ||
              (session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN')
            ) && (
              <Button
                onClick={handleEdit}
                className={FORM_STYLES.btnPrimary}
              >
                <BsPencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                <span>Edit</span>
              </Button>
            )}

            {/* Delete Button - Show if onDelete is provided and:
                - For employees: goal is DRAFT/PENDING
                - For managers/admins: always show (they can delete team goals) */}
            {onDelete && (
              (currentGoal.status === 'DRAFT' || currentGoal.status === 'PENDING') ||
              (session?.user?.role === 'MANAGER' || session?.user?.role === 'ADMIN')
            ) && (
              <Button
                onClick={handleDelete}
                className={FORM_STYLES.btnDanger}
              >
                <BsTrash className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                <span>Delete</span>
              </Button>
            )}

            {/* Employee Submit Button - Only for self-created DRAFT goals (not manager-assigned) */}
            {onSubmitGoal &&
              currentGoal.status === 'DRAFT' &&
              currentGoal.manager &&
              currentGoal.employee &&
              currentGoal.manager.id === currentGoal.employee.id && (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={FORM_STYLES.btnPrimary}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-1.5" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Review</span>
                      <BsArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              )}
            <Button
              variant="ghost"
              onClick={handleClose}
              className="bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary text-xs font-medium h-9 px-4 rounded-lg"
            >
              Close
            </Button>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}