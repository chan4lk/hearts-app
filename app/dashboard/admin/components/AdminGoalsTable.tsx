'use client';

import { useState, useEffect } from 'react';
import { Goal } from '@/app/components/shared/types';
import { 
  BsSquare, 
  BsCheckSquare, 
  BsTrash, 
  BsFlag,
  BsCheckCircle,
  BsXCircle,
  BsClock,
  BsGear,
  BsPlayCircle,
  BsCircle,
  BsPauseCircle
} from 'react-icons/bs';
import { Badge } from '@/app/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminGoalsTableProps {
  goals: Goal[];
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  onGoalClick?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  onBulkDelete?: (goalIds: string[]) => void;
  showEmployee?: boolean;
  showManager?: boolean;
}

export default function AdminGoalsTable({
  goals,
  selectedStatus = '',
  onStatusChange,
  onGoalClick,
  onDelete,
  onBulkDelete,
  showEmployee = true,
  showManager = true
}: AdminGoalsTableProps) {
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // Update selectAll state when goals change
    if (goals.length === 0) {
      setSelectAll(false);
    } else {
      setSelectAll(selectedGoalIds.size === goals.length && goals.length > 0);
    }
  }, [selectedGoalIds, goals]);

  const handleGoalSelect = (goalId: string, selected: boolean) => {
    setSelectedGoalIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(goalId);
      } else {
        newSet.delete(goalId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedGoalIds(new Set(goals.map(g => g.id)));
      setSelectAll(true);
    } else {
      setSelectedGoalIds(new Set());
      setSelectAll(false);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedGoalIds.size > 0) {
      onBulkDelete(Array.from(selectedGoalIds));
      // Don't clear selection here - parent will handle after confirmation
    }
  };

  // Clear selection when goals change externally (e.g., after deletion)
  useEffect(() => {
    // Clear selection if selected goals no longer exist
    if (selectedGoalIds.size > 0) {
      const existingGoalIds = new Set(goals.map(g => g.id));
      const filteredSelection = Array.from(selectedGoalIds).filter(id => existingGoalIds.has(id));
      if (filteredSelection.length !== selectedGoalIds.size) {
        setSelectedGoalIds(new Set(filteredSelection));
        setSelectAll(false);
      }
    }
  }, [goals]);

  // Get status badge with colorful styling
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: BsCheckCircle },
      REJECTED: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: BsXCircle },
      PENDING: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: BsClock },
      MODIFIED: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: BsGear },
      COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: BsCheckCircle },
      DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: BsGear },
      IN_PROGRESS: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: BsPlayCircle },
      NOT_STARTED: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: BsCircle },
      ON_HOLD: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: BsPauseCircle },
      BLOCKED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: BsFlag }
    };
    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0 text-xs px-3 py-1 flex items-center gap-1.5 font-medium`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  // Get priority badge with colorful styling
  const getPriorityBadge = (priority: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      URGENT: { bg: 'bg-red-500/20', text: 'text-red-400' },
      HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
      LOW: { bg: 'bg-gray-500/20', text: 'text-gray-400' }
    };
    const config = configs[priority] || configs.MEDIUM;
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1 font-medium`}>
        {priority || 'MEDIUM'}
      </Badge>
    );
  };

  return (
    <div className="relative">
      {/* Bulk Delete Button */}
      <AnimatePresence>
        {selectedGoalIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium">
                {selectedGoalIds.size} goal{selectedGoalIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <BsTrash className="w-4 h-4" />
              Delete Selected
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Table with Checkboxes */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 w-12">
                <button
                  onClick={() => handleSelectAll(!selectAll)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  {selectAll ? (
                    <BsCheckSquare className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <BsSquare className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Title</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Priority</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Due Date</th>
              {showEmployee && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Employee</th>
              )}
              {showManager && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Manager</th>
              )}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Category</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr>
                <td 
                  colSpan={7 + (showEmployee ? 1 : 0) + (showManager ? 1 : 0)} 
                  className="py-8 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <BsSquare className="w-8 h-8 mb-2 text-gray-500" />
                    <p>No goals found</p>
                  </div>
                </td>
              </tr>
            ) : (
              goals.map((goal) => {
                const isSelected = selectedGoalIds.has(goal.id);
                return (
                  <tr
                    key={goal.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      isSelected ? 'bg-indigo-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoalSelect(goal.id, !isSelected);
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {isSelected ? (
                          <BsCheckSquare className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <BsSquare className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td 
                      className="py-3 px-4 cursor-pointer"
                      onClick={() => onGoalClick?.(goal)}
                    >
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-white truncate">{goal.title}</div>
                        <div className="text-xs text-gray-400 truncate mt-1">{goal.description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {/* Status Badge - Colorful */}
                      {getStatusBadge(goal.status)}
                    </td>
                    <td className="py-3 px-4">
                      {/* Priority Badge - Colorful */}
                      {getPriorityBadge(goal.priority || 'MEDIUM')}
                    </td>
                    <td 
                      className="py-3 px-4 text-sm text-gray-300 cursor-pointer"
                      onClick={() => onGoalClick?.(goal)}
                    >
                      {new Date(goal.dueDate).toLocaleDateString()}
                    </td>
                    {showEmployee && (
                      <td 
                        className="py-3 px-4 text-sm text-gray-300 cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        {goal.employee?.name || 'Unassigned'}
                      </td>
                    )}
                    {showManager && (
                      <td 
                        className="py-3 px-4 text-sm text-gray-300 cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        {(() => {
                          const isSelfCreated = goal.employee && 
                            (!goal.manager || 
                             !goal.managerId || 
                             goal.managerId === null || 
                             goal.managerId === '');
                          
                          if (isSelfCreated) {
                            return 'Self-Created';
                          }
                          return goal.manager?.name || 'Unassigned';
                        })()}
                      </td>
                    )}
                    <td 
                      className="py-3 px-4 text-sm text-gray-300 cursor-pointer"
                      onClick={() => onGoalClick?.(goal)}
                    >
                      {goal.category}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(goal)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                          title="Delete Goal"
                        >
                          <BsTrash className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

