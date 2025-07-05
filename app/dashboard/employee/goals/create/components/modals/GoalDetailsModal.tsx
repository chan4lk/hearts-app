import { motion, AnimatePresence } from 'framer-motion';
import { BsCalendar, BsTag, BsXCircle, BsCheckCircle, BsClock, BsGear, BsTrash, BsChevronDown, BsPencil, BsPerson, BsFlag, BsBuilding, BsX } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { IconType } from 'react-icons';

interface GoalDetailsModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  userIsAdminOrManager: boolean;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { bgColor: string; textColor: string; icon: IconType; label: string }> = {
    APPROVED: { bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400', icon: BsCheckCircle, label: 'Approved' },
    REJECTED: { bgColor: 'bg-rose-500/20', textColor: 'text-rose-400', icon: BsXCircle, label: 'Rejected' },
    COMPLETED: { bgColor: 'bg-blue-500/20', textColor: 'text-blue-400', icon: BsCheckCircle, label: 'Completed' },
    MODIFIED: { bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', icon: BsClock, label: 'Modified' },
    PENDING: { bgColor: 'bg-amber-500/20', textColor: 'text-amber-400', icon: BsClock, label: 'Pending' },
    DRAFT: { bgColor: 'bg-gray-500/20', textColor: 'text-gray-400', icon: BsGear, label: 'Draft' }
  };
  return configs[status] || configs.PENDING;
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const GoalDetailsModal = ({ goal, isOpen, onClose, onEdit = () => {}, onDelete = () => {}, userIsAdminOrManager }: GoalDetailsModalProps) => {
  if (!goal || !isOpen) return null;

  const canEdit = goal.status === 'DRAFT' || goal.status === 'PENDING';
  const canDelete = goal.status === 'DRAFT' || goal.status === 'PENDING';
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [shouldShowExpandButton, setShouldShowExpandButton] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState<number>(0);

  const statusConfig = getStatusConfig(goal.status);
  const priorityConfig = getPriorityConfig(goal.priority || 'MEDIUM');
  const departmentConfig = getDepartmentConfig(goal.department || 'ENGINEERING');

  useEffect(() => {
    const checkDescriptionHeight = () => {
      if (descriptionRef.current) {
        const scrollHeight = descriptionRef.current.scrollHeight;
        setExpandedHeight(scrollHeight);
        const isContentTall = scrollHeight > 80; // Reduced for mobile
        setShouldShowExpandButton(isContentTall);
      }
    };

    if (isOpen) {
      checkDescriptionHeight();
      window.addEventListener('resize', checkDescriptionHeight);
      return () => window.removeEventListener('resize', checkDescriptionHeight);
    }
  }, [isOpen, goal?.description]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-3 z-50" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md mx-auto 
                       shadow-2xl overflow-hidden transform transition-all"
            >
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-16 -right-16 w-32 h-32 sm:w-48 sm:h-48 bg-indigo-500/10 rounded-full"></div>
                <div className="absolute -bottom-16 -left-16 w-32 h-32 sm:w-48 sm:h-48 bg-purple-500/10 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="relative px-3 sm:px-4 py-3 flex items-start justify-between border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={`text-xs ${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                      <statusConfig.icon className="w-3 h-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <Badge className={`text-xs ${priorityConfig.bg} ${priorityConfig.color} border-0`}>
                      <priorityConfig.icon className="w-3 h-3 mr-1" />
                      {priorityConfig.label}
                    </Badge>
                    <Badge className={`text-xs ${departmentConfig.bg} ${departmentConfig.color} border-0`}>
                      <departmentConfig.icon className="w-3 h-3 mr-1" />
                      {departmentConfig.label}
                    </Badge>
                  </div>
                  <h2 className="text-sm sm:text-base font-medium text-white truncate pr-12">{goal.title}</h2>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(goal)}
                      className="h-8 w-8 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10"
                    >
                      <BsPencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(goal)}
                      className="h-8 w-8 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <BsTrash className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <BsX className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="px-3 sm:px-4 pb-4 space-y-3 max-h-[calc(85vh-200px)] overflow-y-auto">
                {/* Description Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-3.5"
                >
                  <div className="relative">
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        !isDescriptionExpanded ? 'overflow-hidden' : ''
                      }`}
                      style={{
                        maxHeight: isDescriptionExpanded ? `${expandedHeight}px` : '80px'
                      }}
                    >
                      <p 
                        ref={descriptionRef}
                        className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-wrap"
                      >
                        {goal.description}
                      </p>
                    </div>
                    
                    {/* Gradient Fade Effect */}
                    {!isDescriptionExpanded && shouldShowExpandButton && (
                      <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
                    )}
                    
                    {/* Show More/Less Button */}
                    {shouldShowExpandButton && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="flex items-center justify-center w-full gap-1.5 mt-2 py-1.5 sm:py-2 text-xs font-medium
                                 text-gray-400 hover:text-white transition-colors rounded-lg
                                 hover:bg-white/5 active:bg-white/10"
                      >
                        <span>{isDescriptionExpanded ? 'Show Less' : 'Show More'}</span>
                        <BsChevronDown 
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ${
                            isDescriptionExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </motion.button>
                    )}
                  </div>
                </motion.div>

                {/* Progress Bar */}
                {goal.progress !== undefined && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </motion.div>
                )}

                {/* Info Grid - Mobile Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                      <BsCalendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs font-medium">Due Date</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white/90">{formatDate(goal.dueDate)}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                      <BsTag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs font-medium">Category</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white/90">{goal.category}</p>
                  </motion.div>
                </div>

                {/* Additional Info - Mobile Responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                      <BsPerson className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs font-medium">Employee</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white/90 truncate">{goal.employee?.name || 'Unassigned'}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                      <BsGear className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-300">
                          <BsGear className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="text-xs font-medium">Manager's Decision</span>
                        </div>
                        <Badge className={`text-xs ${
                          goal.status === 'APPROVED' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/20 text-rose-400'
                        } border-0`}>
                          {goal.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : ''}
                      </div>
                      <div className="bg-black/20 rounded-lg sm:rounded-xl p-2 sm:p-3 mt-2">
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
                                text-xs sm:text-sm p-3 rounded-xl sm:rounded-2xl"
                    >
                      <BsClock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2 animate-pulse" />
                      <span>Awaiting manager approval</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}; 