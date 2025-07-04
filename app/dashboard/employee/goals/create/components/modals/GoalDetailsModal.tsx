import { motion, AnimatePresence } from 'framer-motion';
import { BsCalendar, BsTag, BsXCircle, BsCheckCircle, BsClock, BsGear, BsTrash, BsChevronDown } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { useState, useRef, useEffect } from 'react';

interface GoalDetailsModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  userIsAdminOrManager: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'text-green-500 bg-green-500/10';
    case 'PENDING': return 'text-yellow-500 bg-yellow-500/10';
    case 'REJECTED': return 'text-red-500 bg-red-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED': return <BsCheckCircle className="w-5 h-5" />;
    case 'PENDING': return <BsClock className="w-5 h-5" />;
    case 'REJECTED': return <BsXCircle className="w-5 h-5" />;
    default: return null;
  }
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

  useEffect(() => {
    const checkDescriptionHeight = () => {
      if (descriptionRef.current) {
        const scrollHeight = descriptionRef.current.scrollHeight;
        setExpandedHeight(scrollHeight);
        const isContentTall = scrollHeight > 100;
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
          <div className="fixed inset-0 flex items-center justify-center p-3 z-50" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl w-full max-w-md mx-auto 
                       shadow-2xl overflow-hidden transform transition-all"
            >
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="relative px-4 py-3 flex items-start justify-between border-b border-white/10">
                <div className="flex-1 min-w-0">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${getStatusColor(goal.status)} mb-2`}
                  >
                    {getStatusIcon(goal.status)}
                    <span>{goal.status}</span>
                  </motion.div>
                  <h2 className="text-base font-medium text-white truncate pr-8">{goal.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full -mr-1"
                  >
                    <BsXCircle className="w-5 h-5" />
                  </motion.button>
                </div>
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
                        className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap"
                      >
                        {goal.description}
                      </p>
                    </div>
                    
                    {/* Gradient Fade Effect */}
                    {!isDescriptionExpanded && shouldShowExpandButton && (
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
                    )}
                    
                    {/* Show More/Less Button */}
                    {shouldShowExpandButton && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="flex items-center justify-center w-full gap-1.5 mt-2 py-2 text-xs font-medium
                                 text-gray-400 hover:text-white transition-colors rounded-xl
                                 hover:bg-white/5 active:bg-white/10"
                      >
                        <span>{isDescriptionExpanded ? 'Show Less' : 'Show More'}</span>
                        <BsChevronDown 
                          className={`w-3.5 h-3.5 transition-transform duration-300 ${
                            isDescriptionExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </motion.button>
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
                    <p className="text-sm text-white/90">{formatDate(goal.dueDate)}</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                      <BsTag className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Category</span>
                    </div>
                    <p className="text-sm text-white/90">{goal.category}</p>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-white/10"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onDelete(goal)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20
                        text-red-400 hover:text-red-300 border border-red-500/20 transition-all duration-200"
                    >
                      <BsTrash className="w-3.5 h-3.5" />
                      Delete Goal
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onEdit(goal)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-gradient-to-r from-blue-500/10 to-indigo-600/10 hover:from-blue-500/20 hover:to-indigo-600/20
                        text-blue-400 hover:text-blue-300 border border-blue-500/20 transition-all duration-200"
                    >
                      <BsGear className="w-3.5 h-3.5" />
                      Edit Goal
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}; 