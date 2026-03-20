import { BsCalendar, BsTag, BsGear, BsXCircle, BsCheckCircle, BsClock, BsPencil, BsTrash, BsPerson, BsPlayCircle, BsPauseCircle, BsFlag, BsCircle } from 'react-icons/bs';
import { Goal, ProgressStatus } from '@/app/components/shared/types';
import { IconType } from 'react-icons';
import { CATEGORIES } from '@/app/components/shared/constants';
import { Progress } from '@/app/components/ui/progress';

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goal: Goal) => void;
  showActions?: boolean;
  showEmployee?: boolean;
}

type StatusConfig = { bg: string; text: string; icon: IconType; border?: string; label?: string };
type StatusConfigs = { [key in 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MODIFIED' | 'PENDING' | 'DRAFT' | 'DELETED']: StatusConfig };

const STATUS_CONFIGS: StatusConfigs = {
  APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: BsCheckCircle, border: 'border-emerald-200 dark:border-emerald-500/20' },
  REJECTED: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400', icon: BsXCircle, border: 'border-red-200 dark:border-red-500/20' },
  COMPLETED: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', icon: BsCheckCircle, border: 'border-blue-200 dark:border-blue-500/20' },
  MODIFIED: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: BsClock, border: 'border-amber-200 dark:border-amber-500/20' },
  PENDING: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: BsClock, border: 'border-amber-200 dark:border-amber-500/20' },
  DRAFT: { bg: 'bg-gray-100 dark:bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', icon: BsPencil, border: 'border-gray-200 dark:border-gray-500/20' },
  DELETED: { bg: 'bg-red-100 dark:bg-red-900/10', text: 'text-red-700 dark:text-red-400', icon: BsTrash, border: 'border-red-200 dark:border-red-900/20' },
};

const PROGRESS_STATUS_CONFIG: Record<ProgressStatus, { label: string; color: string; icon: IconType }> = {
  'NOT_STARTED': { label: 'Not Started', color: 'text-gray-500 dark:text-gray-400', icon: BsCircle },
  'IN_PROGRESS': { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', icon: BsPlayCircle },
  'ON_HOLD': { label: 'On Hold', color: 'text-amber-600 dark:text-amber-400', icon: BsPauseCircle },
  'BLOCKED': { label: 'Blocked', color: 'text-red-600 dark:text-red-400', icon: BsFlag },
  'COMPLETED': { label: 'Completed', color: 'text-green-600 dark:text-green-400', icon: BsCheckCircle },
};

export default function GoalCard({ goal, onClick, onEdit, onDelete, showActions = false, showEmployee = false }: GoalCardProps) {
  const statusConfig = STATUS_CONFIGS[goal.status as keyof StatusConfigs] || STATUS_CONFIGS.PENDING;
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
      className="group w-full text-left p-4 rounded-xl bg-surface-elevated border border-theme hover:border-[rgba(var(--color-accent),0.2)] hover:shadow-theme-sm transition-all duration-200 cursor-pointer h-[200px] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-10 flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold text-primary truncate leading-tight">{goal.title}</h3>
          {showEmployee && (
            <div className="flex items-center gap-1.5 text-[11px] text-secondary mt-0.5">
              <BsPerson className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{getEmployeeName()}</span>
            </div>
          )}
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${statusConfig.bg} ${statusConfig.text} flex-shrink-0`}>
          <statusConfig.icon className="w-3 h-3" />
          {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-[13px] text-secondary leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

      {/* Progress */}
      {['DRAFT', 'PENDING', 'APPROVED'].includes(goal.status) && (
        <div className="mt-2 mb-2">
          <div className="flex items-center justify-between mb-1">
            {(() => {
              const progressStatusKey = (goal.progressStatus || 'NOT_STARTED') as ProgressStatus;
              const pConfig = PROGRESS_STATUS_CONFIG[progressStatusKey];
              const StatusIcon = pConfig.icon;
              return (
                <div className={`flex items-center gap-1 text-[11px] ${pConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{pConfig.label}</span>
                </div>
              );
            })()}
            <span className="text-[11px] font-medium text-secondary">{goal.progress || 0}%</span>
          </div>
          <Progress value={goal.progress || 0} className="h-1" />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-theme mt-2">
        <div className="flex items-center gap-3 text-[11px] text-tertiary">
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
          <div className="flex items-center gap-0.5">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
                className="p-1.5 text-secondary hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                title="Edit"
              >
                <BsGear className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
                className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete"
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
