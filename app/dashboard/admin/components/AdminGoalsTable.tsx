'use client';

import { useState, useEffect, useMemo } from 'react';
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
  BsPauseCircle,
  BsBullseye,
  BsInbox,
  BsArrowUp,
  BsArrowDown,
  BsArrowsExpand
} from 'react-icons/bs';
import { Badge } from '@/app/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

type SortColumn = 'title' | 'status' | 'priority' | 'dueDate' | 'employee' | 'manager' | 'category';
type SortDirection = 'asc' | 'desc' | null;

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
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
      // Select all goals (we'll filter by sorted goals in the display)
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
      <Badge className={`${config.bg} ${config.text} border-0 text-[10px] px-1.5 py-0.5 flex items-center gap-1 font-medium whitespace-nowrap`}>
        <Icon className="w-3 h-3" />
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
      <Badge className={`${config.bg} ${config.text} border-0 text-[10px] px-1.5 py-0.5 font-medium whitespace-nowrap`}>
        {priority || 'MEDIUM'}
      </Badge>
    );
  };

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort goals based on current sort column and direction
  const sortedGoals = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return goals;
    }

    return [...goals].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          aValue = priorityOrder[a.priority || 'MEDIUM'] || 0;
          bValue = priorityOrder[b.priority || 'MEDIUM'] || 0;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate).getTime();
          bValue = new Date(b.dueDate).getTime();
          break;
        case 'employee':
          aValue = a.employee?.name?.toLowerCase() || 'zzz';
          bValue = b.employee?.name?.toLowerCase() || 'zzz';
          break;
        case 'manager':
          const isSelfCreatedA = a.employee && (!a.manager || !a.managerId || a.managerId === null || a.managerId === '');
          const isSelfCreatedB = b.employee && (!b.manager || !b.managerId || b.managerId === null || b.managerId === '');
          aValue = isSelfCreatedA ? 'zzz' : (a.manager?.name?.toLowerCase() || 'zzz');
          bValue = isSelfCreatedB ? 'zzz' : (b.manager?.name?.toLowerCase() || 'zzz');
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [goals, sortColumn, sortDirection]);

  // Get sort icon for a column
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <span className="text-white/60 text-xs">⇅</span>;
    }
    if (sortDirection === 'asc') {
      return <span className="text-yellow-300 font-bold text-sm drop-shadow-lg">↑</span>;
    }
    if (sortDirection === 'desc') {
      return <span className="text-yellow-300 font-bold text-sm drop-shadow-lg">↓</span>;
    }
    return <span className="text-white/60 text-xs">⇅</span>;
  };

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Bulk Delete Button */}
      <AnimatePresence>
        {selectedGoalIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 flex items-center justify-between p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg flex-shrink-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-white font-medium">
                {selectedGoalIds.size} goal{selectedGoalIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors text-xs font-medium"
            >
              <BsTrash className="w-3 h-3" />
              Delete Selected
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Table with Checkboxes */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <thead className="sticky top-0 z-20 bg-gradient-to-r from-indigo-600 to-purple-600 border-b-2 border-indigo-700 dark:border-indigo-500 shadow-md">
              <tr>
                <th className="text-left py-2.5 px-3 w-12" style={{ width: '3%' }}>
                  <button
                    onClick={() => handleSelectAll(!selectAll)}
                    className="p-1 hover:bg-indigo-700 rounded transition-colors"
                  >
                    {selectAll ? (
                      <BsCheckSquare className="w-4 h-4 text-white" />
                    ) : (
                      <BsSquare className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </th>
                <th 
                  className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  style={{ width: '18%' }}
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Title</span>
                    {getSortIcon('title')}
                  </div>
                </th>
                <th 
                  className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  style={{ width: '8%' }}
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    {getSortIcon('priority')}
                  </div>
                </th>
                <th 
                  className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  style={{ width: '9%' }}
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    {getSortIcon('dueDate')}
                  </div>
                </th>
                {showEmployee && (
                  <th 
                    className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    style={{ width: '12%' }}
                    onClick={() => handleSort('employee')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Employee</span>
                      {getSortIcon('employee')}
                    </div>
                  </th>
                )}
                {showManager && (
                  <th 
                    className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    style={{ width: '12%' }}
                    onClick={() => handleSort('manager')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Manager</span>
                      {getSortIcon('manager')}
                    </div>
                  </th>
                )}
                <th 
                  className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  style={{ width: '10%' }}
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Category</span>
                    {getSortIcon('category')}
                  </div>
                </th>
                <th className="text-left py-2.5 px-3 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap" style={{ width: '7%' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {goals.length === 0 ? (
                <tr>
                  <td 
                    colSpan={7 + (showEmployee ? 1 : 0) + (showManager ? 1 : 0)} 
                    className="py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <BsBullseye className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">No goals found</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Try adjusting your filters to see more results</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedGoals.map((goal) => {
                  const isSelected = selectedGoalIds.has(goal.id);
                  return (
                    <tr
                      key={goal.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors whitespace-nowrap ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoalSelect(goal.id, !isSelected);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {isSelected ? (
                            <BsCheckSquare className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <BsSquare className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td 
                        className="py-2 px-3 cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        <div className="max-w-xs">
                          <div className="text-[11px] font-medium text-gray-900 dark:text-gray-100 truncate">{goal.title}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{goal.description}</div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {getStatusBadge(goal.status)}
                      </td>
                      <td className="py-2 px-3">
                        {getPriorityBadge(goal.priority || 'MEDIUM')}
                      </td>
                      <td 
                        className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </td>
                      {showEmployee && (
                        <td 
                          className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 truncate cursor-pointer"
                          onClick={() => onGoalClick?.(goal)}
                        >
                          {goal.employee?.name || <span className="text-gray-400">Unassigned</span>}
                        </td>
                      )}
                      {showManager && (
                        <td 
                          className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 truncate cursor-pointer"
                          onClick={() => onGoalClick?.(goal)}
                        >
                          {(() => {
                            const isSelfCreated = goal.employee && 
                              (!goal.manager || 
                               !goal.managerId || 
                               goal.managerId === null || 
                               goal.managerId === '');
                            
                            if (isSelfCreated) {
                              return <span className="text-blue-600 dark:text-blue-400">Self-Created</span>;
                            }
                            return goal.manager?.name || <span className="text-gray-400">Unassigned</span>;
                          })()}
                        </td>
                      )}
                      <td 
                        className="py-2 px-3 text-[11px] text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        {goal.category}
                      </td>
                      <td className="py-2 px-3 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(goal)}
                            className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete Goal"
                          >
                            <BsTrash className="w-3 h-3" />
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
    </div>
  );
}

