'use client';

import { useState } from 'react';
import { Goal } from './types';
import { BsSearch, BsFilter, BsEye, BsPencil, BsTrash, BsCheckCircle, BsXCircle, BsClock, BsGear, BsFlag } from 'react-icons/bs';
import { Badge } from '@/app/components/ui/badge';

interface GoalsTableProps {
  goals: Goal[];
  searchQuery?: string;
  selectedStatus?: string;
  onSearchChange?: (query: string) => void;
  onStatusChange?: (status: string) => void;
  onGoalClick?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  showEmployee?: boolean;
  showManager?: boolean;
  showActions?: boolean;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'MODIFIED', label: 'Modified' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DRAFT', label: 'Draft' }
];

const getStatusBadge = (status: string) => {
  const configs: Record<string, { bg: string; text: string; icon: any }> = {
    APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: BsCheckCircle },
    REJECTED: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: BsXCircle },
    PENDING: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: BsClock },
    MODIFIED: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: BsGear },
    COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: BsCheckCircle },
    DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: BsGear }
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <Badge className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1 flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};

const getPriorityBadge = (priority: string) => {
  const configs: Record<string, { bg: string; text: string }> = {
    HIGH: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
    MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
  };
  const config = configs[priority] || configs.MEDIUM;
  return (
    <Badge className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1`}>
      {priority}
    </Badge>
  );
};

export default function GoalsTable({
  goals,
  searchQuery = '',
  selectedStatus = '',
  onSearchChange,
  onStatusChange,
  onGoalClick,
  onEdit,
  onDelete,
  showEmployee = false,
  showManager = false,
  showActions = false
}: GoalsTableProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localSelectedStatus, setLocalSelectedStatus] = useState(selectedStatus);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleStatusChange = (value: string) => {
    setLocalSelectedStatus(value);
    onStatusChange?.(value);
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = 
      goal.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      (showEmployee && goal.employee?.name?.toLowerCase().includes(localSearchQuery.toLowerCase())) ||
      (showManager && goal.manager?.name?.toLowerCase().includes(localSearchQuery.toLowerCase()));
    
    const matchesStatus = !localSelectedStatus || goal.status === localSelectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-4">
      {/* Search and Filter Section */}
      {(onSearchChange || onStatusChange) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {onSearchChange && (
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsSearch className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search goals..."
                value={localSearchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white/90 text-sm rounded-lg border border-white/10 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent 
                         hover:bg-white/10 transition-colors placeholder-gray-400"
              />
            </div>
          )}

          {onStatusChange && (
            <div className="relative group sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsFilter className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <select
                value={localSelectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white/90 text-sm rounded-lg 
                         border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                         hover:bg-white/10 transition-colors appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
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
              {(onGoalClick || onEdit || onDelete) && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredGoals.length === 0 ? (
              <tr>
                <td colSpan={4 + (showEmployee ? 1 : 0) + (showManager ? 1 : 0) + ((onGoalClick || onEdit || onDelete) ? 1 : 0)} className="py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center">
                    <BsFlag className="w-8 h-8 mb-2 text-gray-500" />
                    <p>No goals found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredGoals.map((goal) => (
                <tr 
                  key={goal.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onGoalClick?.(goal)}
                >
                  <td className="py-3 px-4">
                    <div className="max-w-xs">
                      <div className="text-sm font-medium text-white truncate">{goal.title}</div>
                      <div className="text-xs text-gray-400 truncate mt-1">{goal.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(goal.status)}
                  </td>
                  <td className="py-3 px-4">
                    {getPriorityBadge(goal.priority || 'MEDIUM')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {new Date(goal.dueDate).toLocaleDateString()}
                  </td>
                  {showEmployee && (
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {goal.employee?.name || 'Unassigned'}
                    </td>
                  )}
                  {showManager && (
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {goal.manager?.name || 'Unassigned'}
                    </td>
                  )}
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {goal.category}
                  </td>
                  {(onGoalClick || onEdit || onDelete) && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {onGoalClick && (
                          <button
                            onClick={() => onGoalClick(goal)}
                            className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
                            title="View"
                          >
                            <BsEye className="w-4 h-4" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(goal)}
                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                            title="Edit"
                          >
                            <BsPencil className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(goal)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <BsTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
        Showing {filteredGoals.length} of {goals.length} goals
      </div>
    </div>
  );
}

