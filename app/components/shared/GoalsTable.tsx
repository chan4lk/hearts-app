'use client';

import { useState, useEffect } from 'react';
import { Goal, GoalWithRatingExtended } from './types';
import { BsSearch, BsFilter, BsEye, BsPencil, BsTrash, BsCheckCircle, BsXCircle, BsClock, BsGear, BsFlag, BsPlayCircle, BsCircle, BsPauseCircle, BsStar, BsStarFill } from 'react-icons/bs';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useSession } from 'next-auth/react';
import { showToast } from '@/app/utils/toast';

interface GoalsTableProps {
  goals: (Goal | GoalWithRatingExtended)[];
  searchQuery?: string;
  selectedStatus?: string;
  onSearchChange?: (query: string) => void;
  onStatusChange?: (status: string) => void;
  onGoalClick?: (goal: Goal | GoalWithRatingExtended) => void;
  onEdit?: (goal: Goal | GoalWithRatingExtended) => void;
  onDelete?: (goal: Goal | GoalWithRatingExtended) => void;
  onStatusUpdate?: (goalId: string, newStatus: string, updatedGoal: Goal | GoalWithRatingExtended) => void;
  onRatingChange?: (goalId: string, rating: number) => void;
  showEmployee?: boolean;
  showManager?: boolean;
  showActions?: boolean;
  showRating?: boolean;
  disableStatusUpdate?: boolean;
  submittingRating?: string | null;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'MODIFIED', label: 'Modified' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'BLOCKED', label: 'Blocked' }
];

const getStatusBadge = (status: string, goal?: Goal, session?: any, onStatusChange?: (goalId: string, newStatus: string) => void, updatingStatus?: string | null) => {
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
  
  // Check if status can be updated
  const isEmployee = goal && session && session.user?.id === goal.employeeId;
  const isManagerOrAdmin = goal && session && (session.user?.role === 'MANAGER' || session.user?.role === 'ADMIN');
  const isGoalManager = goal && session && goal.managerId === session.user?.id;
  
  const canUpdate = goal && session && onStatusChange && (
    (isEmployee && (status === 'PENDING' || status === 'APPROVED')) ||
    (isManagerOrAdmin && isGoalManager && (status === 'PENDING' || status === 'DRAFT' || status === 'APPROVED'))
  );

  if (canUpdate && goal) {
    return (
      <Select
        value={status}
        onValueChange={(newStatus) => onStatusChange(goal.id, newStatus)}
        disabled={updatingStatus === goal.id}
      >
        <SelectTrigger className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1 h-auto hover:opacity-80 transition-opacity cursor-pointer`} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <Icon className="w-3 h-3" />
            <SelectValue>{status.replace('_', ' ')}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700" onClick={(e) => e.stopPropagation()}>
          {isEmployee ? (
            // Employee can update to these statuses
            <>
              <SelectItem value="NOT_STARTED">Not Started</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </>
          ) : (
            // Manager/Admin can approve/reject or update approved goals
            <>
              {(status === 'PENDING' || status === 'DRAFT') ? (
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
    );
  }

  return (
    <Badge className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1 flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ')}
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

const RATING_OPTIONS = [
  { value: 0, label: 'Not Rated', stars: '' },
  { value: 1, label: 'Poor (1)', stars: '⭐' },
  { value: 2, label: 'Fair (2)', stars: '⭐⭐' },
  { value: 3, label: 'Good (3)', stars: '⭐⭐⭐' },
  { value: 4, label: 'Very Good (4)', stars: '⭐⭐⭐⭐' },
  { value: 5, label: 'Excellent (5)', stars: '⭐⭐⭐⭐⭐' }
];

const getRatingDisplay = (rating: number | null | undefined) => {
  if (!rating || rating === 0) return 'Not Rated';
  const option = RATING_OPTIONS.find(opt => opt.value === rating);
  return option ? `${option.stars} ${rating}` : `${rating}/5`;
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
  onStatusUpdate,
  onRatingChange,
  showEmployee = false,
  showManager = false,
  showActions = false,
  showRating = false,
  disableStatusUpdate = false,
  submittingRating = null
}: GoalsTableProps) {
  const { data: session } = useSession();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localSelectedStatus, setLocalSelectedStatus] = useState(selectedStatus);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [localGoals, setLocalGoals] = useState<(Goal | GoalWithRatingExtended)[]>(goals);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleStatusChange = (value: string) => {
    setLocalSelectedStatus(value);
    onStatusChange?.(value);
  };

  // Update local goals when props change
  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  const handleQuickStatusUpdate = async (goalId: string, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUpdatingStatus(goalId);
    try {
      const response = await fetch(`/api/goals/${goalId}/status`, {
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

      // Find the current goal to preserve any fields not in the API response
      const currentGoal = localGoals.find(g => g.id === goalId);
      if (!currentGoal) {
        throw new Error('Goal not found in local state');
      }

      // Transform the updated goal to match the expected format
      const transformedGoal: Goal | GoalWithRatingExtended = {
        ...currentGoal,
        ...updatedGoal,
        id: updatedGoal.id,
        title: updatedGoal.title,
        description: updatedGoal.description,
        status: updatedGoal.status,
        dueDate: updatedGoal.dueDate ? (typeof updatedGoal.dueDate === 'string' ? updatedGoal.dueDate : updatedGoal.dueDate.toISOString()) : currentGoal.dueDate,
        category: updatedGoal.category || currentGoal.category,
        department: updatedGoal.department || currentGoal.department,
        priority: updatedGoal.priority || currentGoal.priority,
        createdAt: updatedGoal.createdAt ? (typeof updatedGoal.createdAt === 'string' ? updatedGoal.createdAt : updatedGoal.createdAt.toISOString()) : currentGoal.createdAt,
        updatedAt: updatedGoal.updatedAt ? (typeof updatedGoal.updatedAt === 'string' ? updatedGoal.updatedAt : updatedGoal.updatedAt.toISOString()) : currentGoal.updatedAt,
        employeeId: updatedGoal.employeeId || currentGoal.employeeId,
        managerId: updatedGoal.managerId || currentGoal.managerId,
        employee: updatedGoal.employee || currentGoal.employee,
        manager: updatedGoal.manager || currentGoal.manager,
        rating: updatedGoal.rating || (currentGoal as any)?.rating,
        isApprovalProcess: (currentGoal as any)?.isApprovalProcess || false
      } as Goal | GoalWithRatingExtended;

      // Update local state immediately with full updated goal object
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      // Notify parent component if callback provided with full updated goal
      onStatusUpdate?.(goalId, newStatus, transformedGoal as Goal | GoalWithRatingExtended);

      showToast.success('Status Updated', `Goal status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      showToast.error('Update Failed', error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredGoals = localGoals.filter(goal => {
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
              {showRating && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Rating</th>
              )}
              {(onGoalClick || onEdit || onDelete) && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredGoals.length === 0 ? (
              <tr>
                <td colSpan={4 + (showEmployee ? 1 : 0) + (showManager ? 1 : 0) + (showRating ? 1 : 0) + ((onGoalClick || onEdit || onDelete) ? 1 : 0)} className="py-8 text-center text-gray-400">
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
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(goal.status, goal, session, disableStatusUpdate ? undefined : handleQuickStatusUpdate, updatingStatus)}
                    </div>
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
                  {showRating && (
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {onRatingChange ? (
                        <Select
                          key={`rating-${goal.id}-${(goal as any).rating?.managerScore ?? (goal as any).rating?.score ?? 0}`}
                          value={String((goal as any).rating?.managerScore ?? (goal as any).rating?.score ?? 0)}
                          onValueChange={(value) => {
                            const ratingValue = parseInt(value);
                            if (ratingValue > 0) {
                              onRatingChange(goal.id, ratingValue);
                            }
                          }}
                          disabled={submittingRating === goal.id}
                        >
                          <SelectTrigger className="bg-gray-800/50 border border-white/10 text-white/90 text-xs px-3 py-1.5 h-auto hover:bg-gray-700/50 transition-colors cursor-pointer min-w-[120px]">
                            <div className="flex items-center gap-1.5">
                              {((goal as any).rating?.managerScore ?? (goal as any).rating?.score) ? (
                                <>
                                  <SelectValue>
                                    {getRatingDisplay((goal as any).rating?.managerScore ?? (goal as any).rating?.score)}
                                  </SelectValue>
                                </>
                              ) : (
                                <>
                                  <BsStar className="w-3 h-3 text-gray-400" />
                                  <SelectValue>Not Rated</SelectValue>
                                </>
                              )}
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700" onClick={(e) => e.stopPropagation()}>
                            {RATING_OPTIONS.map(option => (
                              <SelectItem 
                                key={option.value} 
                                value={String(option.value)}
                                className="text-white/90 hover:bg-gray-700 focus:bg-gray-700"
                              >
                                <div className="flex items-center gap-2">
                                  {option.value > 0 && <BsStarFill className="w-3 h-3 text-yellow-400" />}
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          {((goal as any).rating?.managerScore ?? (goal as any).rating?.score) ? (
                            <>
                              <BsStarFill className="w-3 h-3 text-yellow-400" />
                              <span>{getRatingDisplay((goal as any).rating?.managerScore ?? (goal as any).rating?.score)}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">Not Rated</span>
                          )}
                        </div>
                      )}
                    </td>
                  )}
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

