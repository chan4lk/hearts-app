'use client';

import { useState, useEffect, useMemo } from 'react';
import { Goal, GoalWithRatingExtended } from './types';
import { BsBullseye } from 'react-icons/bs';
import { TableEmptyState } from '@/app/components/ui/table-primitives';
import { useSession } from 'next-auth/react';
import GoalsTableFilters, { SortColumn, SortDirection } from './GoalsTableFilters';
import GoalsTableRow, { getRatingValue } from './GoalsTableRow';

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

    const currentGoal = localGoals.find(g => g.id === goalId);
    if (!currentGoal) return;

    // OPTIMISTIC UPDATE: Update UI immediately before API call
    const optimisticGoal: Goal | GoalWithRatingExtended = {
      ...currentGoal,
      priority: newPriority as any,
      updatedAt: new Date().toISOString()
    } as Goal | GoalWithRatingExtended;

    setLocalGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

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

      const transformedGoal: Goal | GoalWithRatingExtended = {
        ...currentGoal,
        ...updatedGoal,
        id: updatedGoal.id,
        title: updatedGoal.title || currentGoal.title,
        description: updatedGoal.description || currentGoal.description,
        status: currentGoal.status,
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

      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      onPriorityUpdate?.(goalId, newPriority, transformedGoal);
    } catch (error) {
      // REVERT optimistic update on error
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );

      onPriorityUpdate?.(goalId, currentGoal.priority || 'MEDIUM', currentGoal as Goal | GoalWithRatingExtended);
    } finally {
      setUpdatingPriority(null);
    }
  };

  const handleQuickStatusUpdate = async (goalId: string, newStatus: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const currentGoal = localGoals.find(g => g.id === goalId);
    if (!currentGoal) return;

    // OPTIMISTIC UPDATE
    const optimisticGoal: Goal | GoalWithRatingExtended = {
      ...currentGoal,
      status: newStatus as any,
      updatedAt: new Date().toISOString()
    } as Goal | GoalWithRatingExtended;

    setLocalGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

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

      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      onStatusUpdate?.(goalId, newStatus, transformedGoal);
    } catch (error) {
      // REVERT optimistic update on error
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );

      onStatusUpdate?.(goalId, currentGoal.status, currentGoal as Goal | GoalWithRatingExtended);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleQuickDueDateUpdate = async (goalId: string, newDueDate: string, e?: any) => {
    e?.stopPropagation();

    const currentGoal = localGoals.find(g => g.id === goalId);
    if (!currentGoal) return;

    // OPTIMISTIC UPDATE
    const optimisticGoal: Goal | GoalWithRatingExtended = {
      ...currentGoal,
      dueDate: newDueDate,
      updatedAt: new Date().toISOString()
    } as Goal | GoalWithRatingExtended;

    setLocalGoals(prevGoals =>
      prevGoals.map(goal =>
        goal.id === goalId ? optimisticGoal : goal
      )
    );

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

      const transformedGoal: Goal | GoalWithRatingExtended = {
        ...currentGoal,
        ...updatedGoal,
        id: updatedGoal.id,
        title: updatedGoal.title || currentGoal.title,
        description: updatedGoal.description || currentGoal.description,
        status: currentGoal.status,
        priority: currentGoal.priority,
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

      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? transformedGoal : goal
        )
      );

      onDueDateUpdate?.(goalId, newDueDate, transformedGoal);
    } catch (error) {
      // REVERT optimistic update on error
      setLocalGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId ? currentGoal : goal
        )
      );

      onDueDateUpdate?.(goalId, currentGoal.dueDate, currentGoal as Goal | GoalWithRatingExtended);
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

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Table Container with Fixed Header */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <GoalsTableFilters
              showEmployee={showEmployee}
              showManager={showManager}
              showActions={showActions}
              showRating={showRating}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
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
                  <GoalsTableRow
                    key={goal.id}
                    goal={goal}
                    session={session}
                    showEmployee={showEmployee}
                    showManager={showManager}
                    showActions={showActions}
                    showRating={showRating}
                    disableStatusUpdate={disableStatusUpdate}
                    updatingStatus={updatingStatus}
                    updatingPriority={updatingPriority}
                    updatingDueDate={updatingDueDate}
                    optimisticRatings={optimisticRatings}
                    ratingUpdateCounter={ratingUpdateCounter}
                    submittingRating={submittingRating}
                    canEditPriority={canEditPriority}
                    canEditDueDate={canEditDueDate}
                    allowedStatuses={allowedStatuses}
                    onGoalClick={onGoalClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={handleQuickStatusUpdate}
                    onPriorityChange={onPriorityUpdate ? handleQuickPriorityUpdate : undefined}
                    onDueDateChange={onDueDateUpdate ? handleQuickDueDateUpdate : undefined}
                    onRatingChange={onRatingChange}
                    onOptimisticRatingSet={(goalId, rating) => {
                      setOptimisticRatings(prev => ({ ...prev, [goalId]: rating }));
                    }}
                  />
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
