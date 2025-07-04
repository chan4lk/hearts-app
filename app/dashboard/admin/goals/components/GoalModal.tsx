import { Goal } from '@/app/components/shared/types';
import { CATEGORIES } from '@/app/components/shared/constants';
import { Badge } from '@/app/components/ui/badge';
import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsBriefcase, BsListTask, BsX, BsStars, BsCalendar, BsPerson, BsGear, BsTrash } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface GoalModalProps {
  goal: Goal;
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalModal({ goal, onClose, onEdit, onDelete }: GoalModalProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
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
    const checkDescriptionHeight = () => {
      if (descriptionRef.current) {
        const scrollHeight = descriptionRef.current.scrollHeight;
        setExpandedHeight(scrollHeight);
        const isContentTall = scrollHeight > 100;
        setShouldShowExpandButton(isContentTall);
      }
    };

    checkDescriptionHeight();
    window.addEventListener('resize', checkDescriptionHeight);
    return () => window.removeEventListener('resize', checkDescriptionHeight);
  }, [goal.description]);

  const getStatusColor = () => {
    switch (goal.status) {
      case 'PENDING': return 'bg-amber-500/20 text-amber-400';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
      case 'APPROVED': return 'bg-emerald-500/20 text-emerald-400';
      case 'REJECTED': return 'bg-rose-500/20 text-rose-400';
      case 'DRAFT': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCategoryIcon = () => {
    const category = CATEGORIES.find(c => c.value === goal.category);
    if (!category) return null;
    const IconComponent = category.icon;
    return <IconComponent className={`h-4 w-4 ${category.iconColor}`} />;
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(goal.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(goal);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-3 backdrop-blur-sm bg-black/50"
      onClick={onClose}
    >
      <motion.div
        ref={modalRef}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl w-full max-w-md mx-auto 
                 shadow-2xl overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${getStatusColor()} mb-2`}
            >
              {getCategoryIcon()}
              <span>{goal.status}</span>
            </motion.div>
            <h2 className="text-base font-medium text-white truncate pr-8">{goal.title}</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEdit}
              className="text-blue-400 hover:text-blue-300 transition-colors p-1.5 hover:bg-white/10 rounded-full"
              title="Edit Goal"
            >
              <BsGear className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="text-rose-400 hover:text-rose-300 transition-colors p-1.5 hover:bg-white/10 rounded-full"
              title="Delete Goal"
            >
              <BsTrash className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
              title="Close"
            >
              <BsX className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 space-y-3 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* Category */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-white/70"
          >
            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg">
              {getCategoryIcon()}
              <span>{CATEGORIES.find(c => c.value === goal.category)?.label || goal.category}</span>
            </div>
          </motion.div>

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
                  <BsX 
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
                <BsPerson className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Assigned To</span>
              </div>
              <div>
                <p className="text-sm text-white/90 font-medium truncate">{goal.employee?.name}</p>
                <p className="text-xs text-gray-400 truncate">{goal.employee?.email}</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3"
            >
              <div className="flex items-center gap-2 text-gray-300 mb-1.5">
                <BsCalendar className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Due Date</span>
              </div>
              <p className="text-sm text-white/90">
                {new Date(goal.dueDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 