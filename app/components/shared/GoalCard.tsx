import { BsCalendar, BsTag, BsGear, BsXCircle, BsPencil, BsTrash, BsPerson, BsPlayCircle, BsPauseCircle, BsFlag, BsCircle, BsCheckCircle } from 'react-icons/bs';
import { Goal, ProgressStatus } from '@/app/components/shared/types';
import { IconType } from 'react-icons';
import { CATEGORIES } from '@/app/components/shared/constants';
import { Progress } from '@/app/components/ui/progress';
import { StatusBadge } from '@/app/components/shared/feedback';
import { getStatusConfig } from '@/app/utils/badgeConfigs';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  showActions?: boolean;
  showEmployee?: boolean;
}

const PROGRESS_STATUS_CONFIG: Record<ProgressStatus, { label: string; color: string; icon: IconType }> = {
  'NOT_STARTED': { label: 'Not Started', color: 'text-tertiary', icon: BsCircle },
  'IN_PROGRESS': { label: 'In Progress', color: 'text-info', icon: BsPlayCircle },
  'ON_HOLD':     { label: 'On Hold',     color: 'text-warning', icon: BsPauseCircle },
  'BLOCKED':     { label: 'Blocked',     color: 'text-error', icon: BsFlag },
  'COMPLETED':   { label: 'Completed',   color: 'text-success', icon: BsCheckCircle },
};

export default function GoalCard({ goal, onClick, onEdit, onDelete, showActions = false, showEmployee = false }: GoalCardProps) {
  const statusConfig = getStatusConfig(goal.status);
  const categoryConfig = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
  const Icon = categoryConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getEmployeeName = () => {
    if (goal.employee && typeof goal.employee === 'object' && 'name' in goal.employee) return goal.employee.name;
    return 'Unknown';
  };

  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-5 rounded-2xl bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.25)] hover:shadow-theme-lg transition-all duration-300 cursor-pointer h-[210px] flex flex-col focus-ring relative overflow-hidden"
    >
      {/* Hover accent gradient — top edge */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[rgb(var(--color-accent))]/0 to-transparent group-hover:via-[rgb(var(--color-accent))]/40 transition-all duration-500" />

      {/* Header */}
      <div className="flex items-start gap-3 mb-2.5">
        <div className={`p-2 rounded-xl ${categoryConfig.iconColor} bg-surface-secondary flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary truncate leading-tight">{goal.title}</h3>
          {showEmployee && (
            <div className="flex items-center gap-1.5 text-xs text-secondary mt-0.5">
              <BsPerson className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{getEmployeeName()}</span>
            </div>
          )}
        </div>
        <StatusBadge type="status" value={goal.status} size="sm" />
      </div>

      {/* Description */}
      <p className="text-xs text-secondary leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

      {/* Progress */}
      {['APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'BLOCKED'].includes(goal.status) && (
        <div className="mt-2 mb-2">
          <div className="flex items-center justify-between mb-1">
            {(() => {
              const progressStatusKey = (goal.progressStatus || 'NOT_STARTED') as ProgressStatus;
              const pConfig = PROGRESS_STATUS_CONFIG[progressStatusKey];
              const StatusIcon = pConfig.icon;
              return (
                <div className={`flex items-center gap-1 text-2xs ${pConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{pConfig.label}</span>
                </div>
              );
            })()}
            <span className="text-2xs font-semibold text-secondary tabular-nums">{goal.progress || 0}%</span>
          </div>
          <Progress value={goal.progress || 0} className="h-1.5" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-theme mt-2">
        <div className="flex items-center gap-3 text-2xs text-tertiary">
          <span className="flex items-center gap-1">
            <BsCalendar className="w-3 h-3" />
            {formatDate(goal.dueDate)}
          </span>
          <span className="flex items-center gap-1">
            <BsTag className="w-3 h-3" />
            {goal.category}
          </span>
        </div>
        {showActions && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
                className="p-1.5 text-secondary hover:text-accent rounded-lg hover:bg-accent-muted transition-colors cursor-pointer focus-ring"
                title="Edit"
                aria-label="Edit goal"
              >
                <BsGear className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
                className="p-1.5 text-secondary hover:text-error rounded-lg hover:bg-error-muted transition-colors cursor-pointer focus-ring"
                title="Delete"
                aria-label="Delete goal"
              >
                <BsXCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
