'use client';

import { useState, useEffect, useMemo } from 'react';
import { Goal, GoalWithRatingExtended } from './types';
import { BsEye, BsPencil, BsTrash, BsCheckCircle, BsXCircle, BsClock, BsGear, BsFlag, BsPlayCircle, BsCircle, BsPauseCircle, BsStar, BsStarFill, BsBullseye, BsCalendar } from 'react-icons/bs';
import { TABLE_STYLES, TableEmptyState } from '@/app/components/ui/table-primitives';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useSession } from 'next-auth/react';

type SortColumn = 'title' | 'status' | 'priority' | 'dueDate' | 'employee' | 'manager' | 'category';
type SortDirection = 'asc' | 'desc' | null;

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
  onPriorityUpdate?: (goalId: string, newPriority: string, updatedGoal: Goal | GoalWithRatingExtended) => void;
  onDueDateUpdate?: (goalId: string, newDueDate: string, updatedGoal: Goal | GoalWithRatingExtended) => void;
  onRatingChange?: (goalId: string, rating: number) => void;
  showEmployee?: boolean;
  showManager?: boolean;
  showActions?: boolean;
  showRating?: boolean;
  disableStatusUpdate?: boolean;
  canEditPriority?: (goal: Goal | GoalWithRatingExtended) => boolean;
  canEditDueDate?: (goal: Goal | GoalWithRatingExtended) => boolean;
  allowedStatuses?: (goal: Goal | GoalWithRatingExtended) => string[];
  submittingRating?: string | null;
  showCheckbox?: boolean;
  selectedGoalIds?: string[];
  onGoalSelect?: (goalId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
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
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'BLOCKED', label: 'Blocked' }
];

const getStatusBadge = (status: string, goal?: Goal | GoalWithRatingExtended, session?: any, onStatusChange?: (goalId: string, newStatus: string) => void, updatingStatus?: string | null, disableStatusUpdate?: boolean, allowedStatuses?: (goal: Goal | GoalWithRatingExtended) => string[]) => {
  const configs: Record<string, { bg: string; text: string; icon: any }> = {
    APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: BsCheckCircle },
    REJECTED: { bg: 'bg-rose-500/20', text: 'text-rose-400', icon: BsXCircle },
    PENDING: { bg: 'bg-amber-500/20', text: 'text-warning', icon: BsClock },
    MODIFIED: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: BsGear },
    COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: BsCheckCircle },
    DRAFT: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: BsGear },
    IN_PROGRESS: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: BsPlayCircle },
    ON_HOLD: { bg: 'bg-amber-500/20', text: 'text-warning', icon: BsPauseCircle },
    BLOCKED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: BsFlag }
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  
  // Check if status can be updated
  const isEmployee = goal && session && session.user?.id === goal.employeeId;
  const isManagerOrAdmin = goal && session && (session.user?.role === 'MANAGER' || session.user?.role === 'ADMIN');
  const isGoalManager = goal && session && goal.managerId === session.user?.id;
  
  // Employees can update APPROVED, IN_PROGRESS, ON_HOLD, BLOCKED, and COMPLETED goals to progress statuses
  // BUT DRAFT status is READ-ONLY for employees (needs manager approval/rejection)
  // Managers/Admins can approve/reject DRAFT goals, change APPROVED/REJECTED, or update progress statuses
  // Allow updates if:
  // 1. Status update is not disabled
  // 2. onStatusChange callback is provided
  // 3. For employees: goal is NOT DRAFT (can update APPROVED, IN_PROGRESS, ON_HOLD, BLOCKED, or COMPLETED)
  // 4. For managers: goal is DRAFT, APPROVED, REJECTED, or progress statuses
  // Note: For managers on approve-goals page, they can update any DRAFT goal of their employees
  // IMPORTANT: DRAFT status is READ-ONLY for employees - they cannot change it
  const canUpdate = goal && session && onStatusChange && !disableStatusUpdate && (
    (isEmployee && status !== 'DRAFT' && ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'].includes(status)) ||
    (isManagerOrAdmin && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'].includes(status))
  );
  
  // For employees: Never show dropdown for DRAFT status (it's read-only - needs manager approval)
  // For managers/admins: Show dropdown for DRAFT status (they can approve/reject)
  // Explicitly block dropdown for employees when status is DRAFT
  const isEmployeeViewingDraft = isEmployee && status === 'DRAFT';
  const shouldShowDropdown = !isEmployeeViewingDraft && (canUpdate || (status === 'DRAFT' && isManagerOrAdmin && onStatusChange && !disableStatusUpdate));
  
  if (shouldShowDropdown && goal) {
    // Determine allowed statuses based on current status and user role
    const getAvailableStatuses = () => {
      // If allowedStatuses function provided, use it
      if (allowedStatuses && goal) {
        const allowed = allowedStatuses(goal);
        const statusLabels: Record<string, string> = {
          'IN_PROGRESS': 'In Progress',
          'ON_HOLD': 'On Hold',
          'BLOCKED': 'Blocked',
          'COMPLETED': 'Completed',
          'APPROVED': 'Approved',
          'REJECTED': 'Rejected',
          'MODIFIED': 'Modified',
          'PENDING': 'Pending',
          'DRAFT': 'Draft',
        };
        return allowed.map(statusValue => ({
          value: statusValue,
          label: statusLabels[statusValue] || statusValue.replace('_', ' ')
        }));
      }

      const statusLabels: Record<string, string> = {
        'IN_PROGRESS': 'In Progress',
        'ON_HOLD': 'On Hold',
        'BLOCKED': 'Blocked',
        'COMPLETED': 'Completed',
        'APPROVED': 'Approved',
        'REJECTED': 'Rejected',
        'MODIFIED': 'Modified',
        'PENDING': 'Pending',
        'DRAFT': 'Draft'
      };

      if (isEmployee) {
        // Employees can set to: IN_PROGRESS, ON_HOLD, BLOCKED, COMPLETED
        const allOptions = [
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'ON_HOLD', label: 'On Hold' },
          { value: 'BLOCKED', label: 'Blocked' },
          { value: 'COMPLETED', label: 'Completed' }
        ];

        const validCurrentStatuses = ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'];
        const isValidCurrentStatus = validCurrentStatuses.includes(status);
        const currentStatusIncluded = allOptions.some(opt => opt.value === status);
        
        // If current status is APPROVED or REJECTED, include it in options so employee can see where they're starting from
        if (status === 'APPROVED' || status === 'REJECTED') {
          allOptions.unshift({ value: status, label: statusLabels[status] });
        } else if (!currentStatusIncluded && isValidCurrentStatus && statusLabels[status]) {
          allOptions.unshift({ value: status, label: statusLabels[status] });
        }
        
        return allOptions;
      } else if (isManagerOrAdmin) {
        // Managers can approve/reject DRAFT status, or update other statuses
        if (status === 'DRAFT') {
          const options = [
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' }
          ];
          // Include current status (DRAFT) so user can see current state
          options.unshift({ value: 'DRAFT', label: 'Draft' });
          return options;
        } else if (status === 'APPROVED' || status === 'REJECTED') {
          // Allow changing between APPROVED and REJECTED multiple times
          const options = [
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' }
          ];
          // Include current status
          if (!options.some(opt => opt.value === status) && statusLabels[status]) {
            options.unshift({ value: status, label: statusLabels[status] });
          }
          return options;
        } else {
          // Managers can update progress statuses including COMPLETED
          const options = [
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'ON_HOLD', label: 'On Hold' },
            { value: 'BLOCKED', label: 'Blocked' }
          ];
          // Include current status
          if (!options.some(opt => opt.value === status) && statusLabels[status]) {
            options.unshift({ value: status, label: statusLabels[status] });
          }
          return options;
        }
      }
      return [];
    };

    const availableStatuses = getAvailableStatuses();
    
    // If no available statuses (empty array from allowedStatuses), don't show dropdown - make it read-only
    if (availableStatuses.length === 0) {
      // Return read-only badge instead of dropdown
      return (
        <Badge 
          className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1 flex items-center gap-1`}
        >
          <Icon className="w-3 h-3" />
          {status.replace('_', ' ')}
        </Badge>
      );
    }

    return (
      <Select
        value={status}
        onValueChange={(newStatus) => {
          if (newStatus !== status) {
            onStatusChange(goal.id, newStatus);
          }
        }}
        disabled={updatingStatus === goal.id}
      >
        <SelectTrigger className={`${config.bg} ${config.text} border border-white/20 text-xs px-3 py-1.5 h-auto hover:opacity-90 hover:border-white/30 transition-all cursor-pointer min-w-[150px] font-medium`} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5" />
            <SelectValue>{status.replace('_', ' ')}</SelectValue>
            <BsGear className="w-3 h-3 ml-auto opacity-50 rotate-90" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-surface-elevated border-theme z-50" onClick={(e) => e.stopPropagation()}>
          {availableStatuses.map((statusOption) => {
            const isCurrentStatus = statusOption.value === status;
            const optionConfig = configs[statusOption.value] || configs.PENDING;
            return (
              <SelectItem 
                key={statusOption.value} 
                value={statusOption.value}
                className={`hover:bg-surface-secondary cursor-pointer ${isCurrentStatus ? 'bg-surface-secondary font-semibold' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {optionConfig.icon && <optionConfig.icon className="w-3.5 h-3.5" />}
                  <span>{statusOption.label}</span>
                  {isCurrentStatus && <span className="ml-auto text-xs opacity-60">(Current)</span>}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge 
      className={`${config.bg} ${config.text} border-0 text-xs px-2 py-1 flex items-center gap-1 ${isEmployeeViewingDraft ? 'opacity-60 cursor-not-allowed' : ''}`}
      title={isEmployeeViewingDraft ? 'Draft status requires manager approval/rejection' : undefined}
    >
      <Icon className="w-3 h-3" />
      {status.replace('_', ' ')}
      {isEmployeeViewingDraft && <span className="ml-1 text-2xs opacity-50"></span>}
    </Badge>
  );
};

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' }
];

const getPriorityBadge = (priority: string, goal?: Goal | GoalWithRatingExtended, session?: any, onPriorityChange?: (goalId: string, newPriority: string) => void, updatingPriority?: string | null, canEditPriority?: (goal: Goal | GoalWithRatingExtended) => boolean) => {
  const configs: Record<string, { bg: string; text: string }> = {
    URGENT: { bg: 'bg-red-500/20', text: 'text-red-400' },
    HIGH: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
    MEDIUM: { bg: 'bg-amber-500/20', text: 'text-warning' },
    LOW: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
  };
  const config = configs[priority] || configs.MEDIUM;
  
  // Check if priority can be updated - use canEditPriority function if provided, otherwise use default logic
  const canUpdate = goal && session && onPriorityChange && (
    canEditPriority ? canEditPriority(goal) : (
      (goal.employeeId === session.user?.id) || 
      (session.user?.role === 'MANAGER' || session.user?.role === 'ADMIN')
    )
  );
  
  if (canUpdate && goal) {
    return (
      <Select
        key={`priority-${goal.id}-${priority}`}
        value={priority}
        onValueChange={(newPriority) => {
          if (newPriority && newPriority !== priority) {
            onPriorityChange(goal.id, newPriority);
          }
        }}
        disabled={updatingPriority === goal.id}
      >
        <SelectTrigger className={`${config.bg} ${config.text} border border-white/20 text-xs px-3 py-1.5 h-auto hover:opacity-90 hover:border-white/30 transition-all cursor-pointer min-w-[120px] font-medium`} onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <SelectValue>{priority}</SelectValue>
            <BsGear className="w-3 h-3 ml-auto opacity-50 rotate-90" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-surface-elevated border-theme z-50" onClick={(e) => e.stopPropagation()}>
          {PRIORITY_OPTIONS.map((priorityOption) => {
            const isCurrentPriority = priorityOption.value === priority;
            const optionConfig = configs[priorityOption.value] || configs.MEDIUM;
            return (
              <SelectItem 
                key={priorityOption.value} 
                value={priorityOption.value}
                className={`hover:bg-surface-secondary cursor-pointer ${isCurrentPriority ? 'bg-surface-secondary font-semibold' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${optionConfig.bg.replace('/20', '')}`}></span>
                  <span>{priorityOption.label}</span>
                  {isCurrentPriority && <span className="ml-auto text-xs opacity-60">(Current)</span>}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }
  
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

// Helper to get the rating value (checks managerScore first if showRating is true, otherwise selfScore, then score)
const getRatingValue = (goal: any, prioritizeManagerScore = false) => {
  if (prioritizeManagerScore) {
    // For manager rating page, only use managerScore (don't fallback to score or selfScore)
    const managerScore = goal?.rating?.managerScore;
    // Return managerScore only if it exists and is > 0, otherwise return 0
    return (managerScore !== null && managerScore !== undefined && managerScore > 0) ? managerScore : 0;
  }
  // For other pages, check selfScore, managerScore, then score
  return goal?.rating?.selfScore ?? goal?.rating?.managerScore ?? goal?.rating?.score ?? 0;
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
  onPriorityUpdate,
  onDueDateUpdate,
  onRatingChange,
  showEmployee = false,
  showManager = false,
  showActions = false,
  showRating = false,
  disableStatusUpdate = false,
  submittingRating = null,
  canEditPriority,
  canEditDueDate,
  allowedStatuses
}: GoalsTableProps) {
  const { data: session } = useSession();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localSelectedStatus, setLocalSelectedStatus] = useState(selectedStatus);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingPriority, setUpdatingPriority] = useState<string | null>(null);
  const [updatingDueDate, setUpdatingDueDate] = useState<string | null>(null);
  const [localGoals, setLocalGoals] = useState<(Goal | GoalWithRatingExtended)[]>(goals);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [ratingUpdateCounter, setRatingUpdateCounter] = useState(0);
  const [optimisticRatings, setOptimisticRatings] = useState<Record<string, number>>({});

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
    setLocalGoals(prevLocalGoals => {
      // On initial mount or when goals prop is empty, use props directly
      if (prevLocalGoals.length === 0 || goals.length === 0) {
        return goals;
      }
      
      // Check if this is a refresh (different goal IDs or count)
      const prevIds = new Set(prevLocalGoals.map(g => g.id));
      const newIds = new Set(goals.map(g => g.id));
      const isRefresh = prevLocalGoals.length !== goals.length || 
                       Array.from(newIds).some(id => !prevIds.has(id));
      
      if (isRefresh) {
        // On refresh, clear optimistic ratings and use fresh props
        setOptimisticRatings({});
        return goals;
      }
      
      // For incremental updates, check if ratings have changed
      const hasRatingChanges = goals.some(propGoal => {
        const localGoal = prevLocalGoals.find(g => g.id === propGoal.id);
        if (!localGoal) return false;
        
        // Compare rating values - check if they're different
        const propSelfScore = propGoal.rating?.selfScore ?? null;
        const localSelfScore = localGoal.rating?.selfScore ?? null;
        const propManagerScore = propGoal.rating?.managerScore ?? null;
        const localManagerScore = localGoal.rating?.managerScore ?? null;
        
        // If rating changed and we don't have an active optimistic update, use prop
        if (propSelfScore !== localSelfScore || propManagerScore !== localManagerScore) {
          // Clear optimistic rating for this goal since server has updated it
          if (optimisticRatings[propGoal.id] !== undefined) {
            setOptimisticRatings(prev => {
              const updated = { ...prev };
              delete updated[propGoal.id];
              return updated;
            });
          }
          return true; // Has rating changes
        }
        return false;
      });
      
      // If ratings changed, use props directly (server is source of truth)
      if (hasRatingChanges) {
        return goals.map(propGoal => {
          const localGoal = prevLocalGoals.find(g => g.id === propGoal.id);
          if (!localGoal) return propGoal;
          
          // If we have an active optimistic rating, keep the local version temporarily
          if (optimisticRatings[propGoal.id] !== undefined) {
            return localGoal;
          }
          
          // Otherwise use prop (server data is source of truth)
          return propGoal;
        });
      }
      
      // For other incremental updates, merge keeping optimistic updates
      return goals.map(propGoal => {
        const localGoal = prevLocalGoals.find(g => g.id === propGoal.id);
        if (!localGoal) return propGoal;
        
        // If we have an active optimistic rating, keep the local version
        if (optimisticRatings[propGoal.id] !== undefined) {
          return localGoal;
        }
        
        // Otherwise use prop (server data is source of truth)
        return propGoal;
      });
    });
  }, [goals]); // Remove optimisticRatings from dependencies to prevent loops
  
  // Clear optimistic ratings when they match server response (but not immediately on mount)
  useEffect(() => {
    // Only clear if localGoals has actually changed (not just initial mount)
    if (localGoals.length === 0) return;
    
    setOptimisticRatings(prev => {
      const updated = { ...prev };
      let changed = false;
      
      Object.keys(updated).forEach(goalId => {
        const optimisticRating = updated[goalId];
        const goal = localGoals.find(g => g.id === goalId);
        if (goal) {
          // Detect if this is a self-rating context
          const isSelfRating = goal.employeeId === session?.user?.id;
          // Get server rating based on context
          const serverRating = getRatingValue(goal, !isSelfRating);
          // Clear if server rating matches optimistic (works for both positive ratings and 0 for "Not Rated")
          if (optimisticRating === serverRating) {
            delete updated[goalId];
            changed = true;
          }
        } else {
          // Goal not found, clear optimistic rating
          delete updated[goalId];
          changed = true;
        }
      });
      
      return changed ? updated : prev;
    });
  }, [localGoals, session?.user?.id]);

  const handleQuickPriorityUpdate = async (goalId: string, newPriority: string, e?: any) => {
    e?.stopPropagation();
    
    // Find the current goal to preserve fields
    const currentGoal = localGoals.find(g => g.id === goalId);
    if (!currentGoal) {
      // Error toast removed
      return;
    }

    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticGoal: Goal | GoalWithRatingExtended = {
      ...currentGoal,
      priority: newPriority as any,
      updatedAt: new Date().toISOString()
    } as Goal | GoalWithRatingExtended;

    // Update local state IMMEDIATELY (optimistic update)
    setLocalGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

    // Notify parent component IMMEDIATELY (optimistic update)
    onPriorityUpdate?.(goalId, newPriority, optimisticGoal);

    setUpdatingPriority(goalId);
    
    try {
      const response = await fetch(`/api/goals/${goalId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update priority');
      }

      const data = await response.json();
      const updatedGoal = data.goal || data;

      // Transform the updated goal to match the expected format
      // IMPORTANT: Only update priority, preserve all other fields (especially status)
      const transformedGoal: Goal | GoalWithRatingExtended = {
        ...currentGoal,
        ...updatedGoal,
        id: updatedGoal.id,
        title: updatedGoal.title || currentGoal.title,
        description: updatedGoal.description || currentGoal.description,
        status: currentGoal.status, // Preserve original status - priority update shouldn't change status
        priority: updatedGoal.priority || newPriority,
        dueDate: updatedGoal.dueDate ? (typeof updatedGoal.dueDate === 'string' ? updatedGoal.dueDate : updatedGoal.dueDate.toISOString()) : currentGoal.dueDate,
        category: updatedGoal.category || currentGoal.category,
        department: updatedGoal.department || currentGoal.department,
        createdAt: updatedGoal.createdAt ? (typeof updatedGoal.createdAt === 'string' ? updatedGoal.createdAt : updatedGoal.createdAt.toISOString()) : currentGoal.createdAt,
        updatedAt: updatedGoal.updatedAt ? (typeof updatedGoal.updatedAt === 'string' ? updatedGoal.updatedAt : updatedGoal.updatedAt.toISOString()) : currentGoal.updatedAt,
        employeeId: updatedGoal.employeeId || currentGoal.employeeId,
        managerId: updatedGoal.managerId || currentGoal.managerId,
        employee: updatedGoal.employee || currentGoal.employee,
        manager: updatedGoal.manager || currentGoal.manager,
        rating: updatedGoal.rating || (currentGoal as any)?.rating,
        isApprovalProcess: (currentGoal as any)?.isApprovalProcess || false
      } as Goal | GoalWithRatingExtended;

      // Update local state with server response (sync with server)
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      // Notify parent component with server response
      onPriorityUpdate?.(goalId, newPriority, transformedGoal);

      // Toast removed
    } catch (error) { // handled silently
      // REVERT optimistic update on error
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );
      
      // Revert parent component state
      onPriorityUpdate?.(goalId, currentGoal.priority || 'MEDIUM', currentGoal as Goal | GoalWithRatingExtended);
      
      // Error toast removed
    } finally {
      setUpdatingPriority(null);
    }
  };

  const handleQuickStatusUpdate = async (goalId: string, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Find the current goal to preserve fields
    const currentGoal = localGoals.find(g => g.id === goalId);
    if (!currentGoal) {
      // Error toast removed
      return;
    }

    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticGoal: Goal | GoalWithRatingExtended = {
      ...currentGoal,
      status: newStatus as any,
      updatedAt: new Date().toISOString()
    } as Goal | GoalWithRatingExtended;

    // Update local state IMMEDIATELY (optimistic update)
    setLocalGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

    // Notify parent component IMMEDIATELY (optimistic update)
    onStatusUpdate?.(goalId, newStatus, optimisticGoal);

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

      // Update local state with server response (sync with server)
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      // Notify parent component with server response
      onStatusUpdate?.(goalId, newStatus, transformedGoal);

      // Toast removed
    } catch (error) { // handled silently
      // REVERT optimistic update on error
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );
      
      // Revert parent component state
      onStatusUpdate?.(goalId, currentGoal.status, currentGoal as Goal | GoalWithRatingExtended);
      
      // Error toast removed
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleQuickDueDateUpdate = async (goalId: string, newDueDate: string, e?: any) => {
    e?.stopPropagation();
    
    // Find the current goal to preserve fields
    const currentGoal = localGoals.find(g => g.id === goalId);
    if (!currentGoal) {
      // Error toast removed
      return;
    }

    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticGoal: Goal | GoalWithRatingExtended = {
      ...currentGoal,
      dueDate: newDueDate,
      updatedAt: new Date().toISOString()
    } as Goal | GoalWithRatingExtended;

    // Update local state IMMEDIATELY (optimistic update)
    setLocalGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

    // Notify parent component IMMEDIATELY (optimistic update)
    onDueDateUpdate?.(goalId, newDueDate, optimisticGoal);

    setUpdatingDueDate(goalId);
    
    try {
      const response = await fetch(`/api/goals/${goalId}/due-date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update due date');
      }

      const data = await response.json();
      const updatedGoal = data.goal || data;

      // Transform the updated goal to match the expected format
      const transformedGoal: Goal | GoalWithRatingExtended = {
        ...currentGoal,
        ...updatedGoal,
        id: updatedGoal.id,
        title: updatedGoal.title || currentGoal.title,
        description: updatedGoal.description || currentGoal.description,
        status: currentGoal.status, // Preserve original status
        priority: currentGoal.priority, // Preserve original priority
        dueDate: updatedGoal.dueDate ? (typeof updatedGoal.dueDate === 'string' ? updatedGoal.dueDate : updatedGoal.dueDate.toISOString()) : newDueDate,
        category: updatedGoal.category || currentGoal.category,
        department: updatedGoal.department || currentGoal.department,
        createdAt: updatedGoal.createdAt ? (typeof updatedGoal.createdAt === 'string' ? updatedGoal.createdAt : updatedGoal.createdAt.toISOString()) : currentGoal.createdAt,
        updatedAt: updatedGoal.updatedAt ? (typeof updatedGoal.updatedAt === 'string' ? updatedGoal.updatedAt : updatedGoal.updatedAt.toISOString()) : currentGoal.updatedAt,
        employeeId: updatedGoal.employeeId || currentGoal.employeeId,
        managerId: updatedGoal.managerId || currentGoal.managerId,
        employee: updatedGoal.employee || currentGoal.employee,
        manager: updatedGoal.manager || currentGoal.manager,
        rating: updatedGoal.rating || (currentGoal as any)?.rating,
        isApprovalProcess: (currentGoal as any)?.isApprovalProcess || false
      } as Goal | GoalWithRatingExtended;

      // Update local state with server response (sync with server)
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      // Notify parent component with server response
      onDueDateUpdate?.(goalId, newDueDate, transformedGoal);

      // Toast removed
    } catch (error) { // handled silently
      // REVERT optimistic update on error
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );
      
      // Revert parent component state
      onDueDateUpdate?.(goalId, currentGoal.dueDate, currentGoal as Goal | GoalWithRatingExtended);
      
      // Error toast removed
    } finally {
      setUpdatingDueDate(null);
    }
  };

  const filteredGoals = useMemo(() => {
    return localGoals.filter(goal => {
      const matchesSearch = 
        goal.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        goal.description.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
        (showEmployee && goal.employee?.name?.toLowerCase().includes(localSearchQuery.toLowerCase())) ||
        (showManager && goal.manager?.name?.toLowerCase().includes(localSearchQuery.toLowerCase()));
      
      const matchesStatus = !localSelectedStatus || goal.status === localSelectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [localGoals, localSearchQuery, localSelectedStatus, showEmployee, showManager]);

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
      return filteredGoals;
    }

    return [...filteredGoals].sort((a, b) => {
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
          aValue = a.manager?.name?.toLowerCase() || 'zzz';
          bValue = b.manager?.name?.toLowerCase() || 'zzz';
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
  }, [filteredGoals, sortColumn, sortDirection]);

  // Get sort icon for a column
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <span className="text-secondary text-xs">⇅</span>;
    }
    if (sortDirection === 'asc') {
      return <span className="text-indigo-500 font-bold text-sm">↑</span>;
    }
    if (sortDirection === 'desc') {
      return <span className="text-indigo-500 font-bold text-sm">↓</span>;
    }
    return <span className="text-secondary text-xs">⇅</span>;
  };

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Table Container with Fixed Header */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <thead className={TABLE_STYLES.thead}>
              <tr>
              <th
                className={TABLE_STYLES.thSortable}
                style={{ width: '20%' }}
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Title</span>
                  {getSortIcon('title')}
                </div>
              </th>
              <th
                className={TABLE_STYLES.thSortable}
                style={{ width: '12%' }}
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                className={TABLE_STYLES.thSortable}
                style={{ width: '10%' }}
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Priority</span>
                  {getSortIcon('priority')}
                </div>
              </th>
              <th
                className={TABLE_STYLES.thSortable}
                style={{ width: '12%' }}
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Due Date</span>
                  {getSortIcon('dueDate')}
                </div>
              </th>
              {showEmployee && (
                <th
                  className={TABLE_STYLES.thSortable}
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
                  className={TABLE_STYLES.thSortable}
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
                className={TABLE_STYLES.thSortable}
                style={{ width: '10%' }}
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              {showRating && (
                <th
                  className={TABLE_STYLES.th}
                  style={{ width: '10%' }}
                >
                  Rating
                </th>
              )}
              {showActions && (
                <th
                  className={TABLE_STYLES.th}
                  style={{ width: '10%' }}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedGoals.length === 0 ? (
              <TableEmptyState
                colSpan={5 + (showEmployee ? 1 : 0) + (showManager ? 1 : 0) + (showRating ? 1 : 0) + (showActions ? 1 : 0)}
                icon={<BsBullseye className="w-5 h-5 text-secondary" />}
                title="No goals found"
                subtitle="Try adjusting your filters to see more results"
              />
            ) : (
              sortedGoals.map((goal) => (
                <tr
                  key={goal.id}
                  className={TABLE_STYLES.row}
                  onClick={() => onGoalClick?.(goal)}
                >
                  <td className="py-2.5 px-3 text-xs">
                    <div className="truncate">
                      <div className="font-medium text-primary truncate">{goal.title}</div>
                      <div className="text-secondary truncate mt-0.5 text-xs">{goal.description}</div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-2xs">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {getStatusBadge(goal.status, goal, session, disableStatusUpdate ? undefined : handleQuickStatusUpdate, updatingStatus, disableStatusUpdate, allowedStatuses)}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-2xs" onClick={(e) => e.stopPropagation()}>
                    {getPriorityBadge(goal.priority || 'MEDIUM', goal, session, onPriorityUpdate ? handleQuickPriorityUpdate : undefined, updatingPriority, canEditPriority)}
                  </td>
                  <td className="py-2.5 px-3 text-2xs" onClick={(e) => e.stopPropagation()}>
                    {onDueDateUpdate && (!canEditDueDate || canEditDueDate(goal)) ? (
                      <div className="relative">
                        <input
                          type="date"
                          value={new Date(goal.dueDate).toISOString().split('T')[0]}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleQuickDueDateUpdate(goal.id, e.target.value, e);
                            }
                          }}
                          disabled={updatingDueDate === goal.id}
                          className="bg-surface-secondary border border-white/10 text-primary text-2xs px-2 py-1 pr-6 rounded-md hover:bg-surface-secondary/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus-ring/50 focus:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <BsCalendar className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-secondary pointer-events-none w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <span className="text-secondary truncate">{new Date(goal.dueDate).toLocaleDateString()}</span>
                    )}
                  </td>
                  {showEmployee && (
                    <td className="py-2.5 px-3 text-2xs text-secondary truncate">
                      {goal.employee?.name || 'Unassigned'}
                    </td>
                  )}
                  {showManager && (
                    <td className="py-2.5 px-3 text-2xs text-secondary truncate">
                      {(() => {
                        // Check if this is a self-created goal
                        // Self-created goals have no manager assigned
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
                  <td className="py-2.5 px-3 text-2xs text-secondary truncate">
                    {goal.category}
                  </td>
                  {showRating && (() => {
                    // Detect if this is a self-rating context (employee rating their own goal)
                    const isSelfRating = goal.employeeId === session?.user?.id;
                    
                    // Calculate current rating value - prioritize optimistic, then goal's rating
                    // For self-rating pages, prioritize selfScore; for manager pages, prioritize managerScore
                    const currentRatingValue = optimisticRatings[goal.id] !== undefined 
                      ? optimisticRatings[goal.id] 
                      : getRatingValue(goal, !isSelfRating); // false for self-rating (prioritize selfScore), true for manager (prioritize managerScore)
                    const displayValue = currentRatingValue ?? 0;
                    
                    return (
                      <td className="py-2.5 px-3 text-2xs" onClick={(e) => e.stopPropagation()}>
                        {onRatingChange ? (
                          <Select
                            key={`rating-${goal.id}-${displayValue}-${ratingUpdateCounter}`}
                            value={String(displayValue)}
                            onValueChange={(value) => {
                            const ratingValue = parseInt(value);
                            if (!isNaN(ratingValue)) {
                              // For self-rating pages, let the parent handle all updates (it already does optimistic updates)
                              // Just update optimistic rating for instant UI feedback
                              setOptimisticRatings(prev => ({ ...prev, [goal.id]: ratingValue }));
                              
                              // Call parent handler immediately - parent will handle optimistic updates and API calls
                              onRatingChange(goal.id, ratingValue);
                            }
                          }}
                          disabled={submittingRating === goal.id}
                        >
                          <SelectTrigger className="bg-surface-secondary border border-white/10 text-primary text-xs px-3 py-1.5 h-auto hover:bg-surface-secondary/50 transition-colors cursor-pointer min-w-[120px]">
                            <div className="flex items-center gap-1.5">
                              {displayValue > 0 ? (
                                  <>
                                    <SelectValue>
                                      {getRatingDisplay(displayValue)}
                                    </SelectValue>
                                  </>
                                ) : (
                                  <>
                                    <BsStar className="w-3 h-3 text-secondary" />
                                    <SelectValue>Not Rated</SelectValue>
                                  </>
                                )}
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-surface-elevated border-theme" onClick={(e) => e.stopPropagation()}>
                            {RATING_OPTIONS.map(option => (
                              <SelectItem 
                                key={option.value} 
                                value={String(option.value)}
                                className="text-primary hover:bg-surface-secondary focus:bg-surface-secondary"
                              >
                                <div className="flex items-center gap-2">
                                  {option.value > 0 && <BsStarFill className="w-3 h-3 text-warning" />}
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-secondary">
                            {(() => {
                              const ratingValue = getRatingValue(goal, showRating);
                              return ratingValue > 0 ? (
                                <>
                                  <BsStarFill className="w-3 h-3 text-warning" />
                                  <span>{getRatingDisplay(ratingValue)}</span>
                                </>
                              ) : (
                                <span className="text-tertiary">Not Rated</span>
                              );
                            })()}
                          </div>
                        )}
                      </td>
                    );
                  })()}
                  {showActions && (
                    <td className="py-2.5 px-3 text-2xs">
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
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-theme text-sm text-secondary flex-shrink-0">
        Showing {filteredGoals.length} of {goals.length} goals
      </div>
    </div>
  );
}

