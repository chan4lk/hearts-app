'use client';

import { Goal, GoalWithRatingExtended } from './types';
import {
  BsEye, BsPencil, BsTrash, BsCheckCircle, BsXCircle, BsClock,
  BsGear, BsFlag, BsPlayCircle, BsPauseCircle, BsStar, BsStarFill, BsCalendar
} from 'react-icons/bs';
import { TABLE_STYLES } from '@/app/components/ui/table-primitives';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

// ── Constants ──

export const STATUS_OPTIONS = [
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

export const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' }
];

export const RATING_OPTIONS = [
  { value: 0, label: 'Not Rated', stars: '' },
  { value: 1, label: 'Poor (1)', stars: '\u2B50' },
  { value: 2, label: 'Fair (2)', stars: '\u2B50\u2B50' },
  { value: 3, label: 'Good (3)', stars: '\u2B50\u2B50\u2B50' },
  { value: 4, label: 'Very Good (4)', stars: '\u2B50\u2B50\u2B50\u2B50' },
  { value: 5, label: 'Excellent (5)', stars: '\u2B50\u2B50\u2B50\u2B50\u2B50' }
];

// ── Helpers ──

export const getRatingDisplay = (rating: number | null | undefined) => {
  if (!rating || rating === 0) return 'Not Rated';
  const option = RATING_OPTIONS.find(opt => opt.value === rating);
  return option ? `${option.stars} ${rating}` : `${rating}/5`;
};

// Helper to get the rating value (checks managerScore first if showRating is true, otherwise selfScore, then score)
export const getRatingValue = (goal: any, prioritizeManagerScore = false) => {
  if (prioritizeManagerScore) {
    // For manager rating page, only use managerScore (don't fallback to score or selfScore)
    const managerScore = goal?.rating?.managerScore;
    // Return managerScore only if it exists and is > 0, otherwise return 0
    return (managerScore !== null && managerScore !== undefined && managerScore > 0) ? managerScore : 0;
  }
  // For other pages, check selfScore, managerScore, then score
  return goal?.rating?.selfScore ?? goal?.rating?.managerScore ?? goal?.rating?.score ?? 0;
};

// ── Status Badge ──

const STATUS_CONFIGS: Record<string, { bg: string; text: string; icon: any }> = {
  APPROVED: { bg: 'bg-success-muted', text: 'text-success', icon: BsCheckCircle },
  REJECTED: { bg: 'bg-error-muted', text: 'text-error', icon: BsXCircle },
  PENDING: { bg: 'bg-warning-muted', text: 'text-warning', icon: BsClock },
  MODIFIED: { bg: 'bg-cat-professional', text: 'text-cat-professional', icon: BsGear },
  COMPLETED: { bg: 'bg-cat-training', text: 'text-cat-training', icon: BsCheckCircle },
  DRAFT: { bg: 'bg-surface-secondary', text: 'text-tertiary', icon: BsGear },
  IN_PROGRESS: { bg: 'bg-cat-professional', text: 'text-cat-professional', icon: BsPlayCircle },
  ON_HOLD: { bg: 'bg-warning-muted', text: 'text-warning', icon: BsPauseCircle },
  BLOCKED: { bg: 'bg-error-muted', text: 'text-error', icon: BsFlag }
};

const PRIORITY_CONFIGS: Record<string, { bg: string; text: string }> = {
  URGENT: { bg: 'bg-error-muted', text: 'text-error' },
  HIGH: { bg: 'bg-error-muted', text: 'text-error' },
  MEDIUM: { bg: 'bg-warning-muted', text: 'text-warning' },
  LOW: { bg: 'bg-success-muted', text: 'text-success' }
};

export const getStatusBadge = (
  status: string,
  goal?: Goal | GoalWithRatingExtended,
  session?: any,
  onStatusChange?: (goalId: string, newStatus: string) => void,
  updatingStatus?: string | null,
  disableStatusUpdate?: boolean,
  allowedStatuses?: (goal: Goal | GoalWithRatingExtended) => string[]
) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.PENDING;
  const Icon = config.icon;

  // Check if status can be updated
  const isEmployee = goal && session && session.user?.id === goal.employeeId;
  const isManagerOrAdmin = goal && session && (session.user?.role === 'MANAGER' || session.user?.role === 'ADMIN');

  const canUpdate = goal && session && onStatusChange && !disableStatusUpdate && (
    (isEmployee && status !== 'DRAFT' && ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'].includes(status)) ||
    (isManagerOrAdmin && ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'MODIFIED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'].includes(status))
  );

  const isEmployeeViewingDraft = isEmployee && status === 'DRAFT';
  const shouldShowDropdown = !isEmployeeViewingDraft && (canUpdate || (status === 'DRAFT' && isManagerOrAdmin && onStatusChange && !disableStatusUpdate));

  if (shouldShowDropdown && goal) {
    const getAvailableStatuses = () => {
      if (allowedStatuses && goal) {
        const allowed = allowedStatuses(goal);
        const statusLabels: Record<string, string> = {
          'IN_PROGRESS': 'In Progress', 'ON_HOLD': 'On Hold', 'BLOCKED': 'Blocked',
          'COMPLETED': 'Completed', 'APPROVED': 'Approved', 'REJECTED': 'Rejected',
          'MODIFIED': 'Modified', 'PENDING': 'Pending', 'DRAFT': 'Draft',
        };
        return allowed.map(statusValue => ({
          value: statusValue,
          label: statusLabels[statusValue] || statusValue.replace('_', ' ')
        }));
      }

      const statusLabels: Record<string, string> = {
        'IN_PROGRESS': 'In Progress', 'ON_HOLD': 'On Hold', 'BLOCKED': 'Blocked',
        'COMPLETED': 'Completed', 'APPROVED': 'Approved', 'REJECTED': 'Rejected',
        'MODIFIED': 'Modified', 'PENDING': 'Pending', 'DRAFT': 'Draft'
      };

      if (isEmployee) {
        const allOptions = [
          { value: 'IN_PROGRESS', label: 'In Progress' },
          { value: 'ON_HOLD', label: 'On Hold' },
          { value: 'BLOCKED', label: 'Blocked' },
          { value: 'COMPLETED', label: 'Completed' }
        ];
        const validCurrentStatuses = ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED', 'COMPLETED'];
        const isValidCurrentStatus = validCurrentStatuses.includes(status);
        const currentStatusIncluded = allOptions.some(opt => opt.value === status);
        if (status === 'APPROVED' || status === 'REJECTED') {
          allOptions.unshift({ value: status, label: statusLabels[status] });
        } else if (!currentStatusIncluded && isValidCurrentStatus && statusLabels[status]) {
          allOptions.unshift({ value: status, label: statusLabels[status] });
        }
        return allOptions;
      } else if (isManagerOrAdmin) {
        if (status === 'DRAFT') {
          const options = [
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' }
          ];
          options.unshift({ value: 'DRAFT', label: 'Draft' });
          return options;
        } else if (status === 'APPROVED' || status === 'REJECTED') {
          const options = [
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' }
          ];
          if (!options.some(opt => opt.value === status) && statusLabels[status]) {
            options.unshift({ value: status, label: statusLabels[status] });
          }
          return options;
        } else {
          const options = [
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'ON_HOLD', label: 'On Hold' },
            { value: 'BLOCKED', label: 'Blocked' }
          ];
          if (!options.some(opt => opt.value === status) && statusLabels[status]) {
            options.unshift({ value: status, label: statusLabels[status] });
          }
          return options;
        }
      }
      return [];
    };

    const availableStatuses = getAvailableStatuses();

    if (availableStatuses.length === 0) {
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
            const optionConfig = STATUS_CONFIGS[statusOption.value] || STATUS_CONFIGS.PENDING;
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

// ── Priority Badge ──

export const getPriorityBadge = (
  priority: string,
  goal?: Goal | GoalWithRatingExtended,
  session?: any,
  onPriorityChange?: (goalId: string, newPriority: string) => void,
  updatingPriority?: string | null,
  canEditPriority?: (goal: Goal | GoalWithRatingExtended) => boolean
) => {
  const config = PRIORITY_CONFIGS[priority] || PRIORITY_CONFIGS.MEDIUM;

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
            const optionConfig = PRIORITY_CONFIGS[priorityOption.value] || PRIORITY_CONFIGS.MEDIUM;
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

// ── Row Props ──

export interface GoalsTableRowProps {
  goal: Goal | GoalWithRatingExtended;
  session: any;
  showEmployee: boolean;
  showManager: boolean;
  showActions: boolean;
  showRating: boolean;
  disableStatusUpdate: boolean;
  updatingStatus: string | null;
  updatingPriority: string | null;
  updatingDueDate: string | null;
  optimisticRatings: Record<string, number>;
  ratingUpdateCounter: number;
  submittingRating: string | null;
  canEditPriority?: (goal: Goal | GoalWithRatingExtended) => boolean;
  canEditDueDate?: (goal: Goal | GoalWithRatingExtended) => boolean;
  allowedStatuses?: (goal: Goal | GoalWithRatingExtended) => string[];
  onGoalClick?: (goal: Goal | GoalWithRatingExtended) => void;
  onEdit?: (goal: Goal | GoalWithRatingExtended) => void;
  onDelete?: (goal: Goal | GoalWithRatingExtended) => void;
  onStatusChange?: (goalId: string, newStatus: string) => void;
  onPriorityChange?: (goalId: string, newPriority: string) => void;
  onDueDateChange?: (goalId: string, newDueDate: string, e?: any) => void;
  onRatingChange?: (goalId: string, rating: number) => void;
  onOptimisticRatingSet?: (goalId: string, rating: number) => void;
}

// ── GoalsTableRow Component ──

export default function GoalsTableRow({
  goal,
  session,
  showEmployee,
  showManager,
  showActions,
  showRating,
  disableStatusUpdate,
  updatingStatus,
  updatingPriority,
  updatingDueDate,
  optimisticRatings,
  ratingUpdateCounter,
  submittingRating,
  canEditPriority: canEditPriorityFn,
  canEditDueDate: canEditDateFn,
  allowedStatuses,
  onGoalClick,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onRatingChange,
  onOptimisticRatingSet,
}: GoalsTableRowProps) {
  return (
    <tr
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
          {getStatusBadge(goal.status, goal, session, disableStatusUpdate ? undefined : onStatusChange, updatingStatus, disableStatusUpdate, allowedStatuses)}
        </div>
      </td>
      <td className="py-2.5 px-3 text-2xs" onClick={(e) => e.stopPropagation()}>
        {getPriorityBadge(goal.priority || 'MEDIUM', goal, session, onPriorityChange, updatingPriority, canEditPriorityFn)}
      </td>
      <td className="py-2.5 px-3 text-2xs" onClick={(e) => e.stopPropagation()}>
        {onDueDateChange && (!canEditDateFn || canEditDateFn(goal)) ? (
          <div className="relative">
            <input
              type="date"
              value={new Date(goal.dueDate).toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) {
                  onDueDateChange(goal.id, e.target.value, e);
                }
              }}
              disabled={updatingDueDate === goal.id}
              className="bg-surface-secondary border border-white/10 text-primary text-2xs px-2 py-1 pr-6 rounded-md hover:bg-surface-secondary/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus-ring/50 focus:border-[rgb(var(--color-warning))]/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        const isSelfRating = goal.employeeId === session?.user?.id;
        const currentRatingValue = optimisticRatings[goal.id] !== undefined
          ? optimisticRatings[goal.id]
          : getRatingValue(goal, !isSelfRating);
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
                    onOptimisticRatingSet?.(goal.id, ratingValue);
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
                className="p-1.5 text-accent hover:text-accent hover:bg-accent-muted rounded transition-colors"
                title="View"
              >
                <BsEye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(goal)}
                className="p-1.5 text-cat-professional hover:text-cat-professional hover:bg-cat-professional rounded transition-colors"
                title="Edit"
              >
                <BsPencil className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(goal)}
                className="p-1.5 text-error hover:text-error hover:bg-error-muted rounded transition-colors"
                title="Delete"
              >
                <BsTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
