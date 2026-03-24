'use client';

import { useState, useEffect, useMemo } from 'react';
import { Goal } from '@/app/components/shared/types';
import { BsTrash, BsBullseye } from 'react-icons/bs';
import { Badge } from '@/app/components/ui/badge';
import { getStatusConfig, getPriorityConfig } from '@/app/utils/badgeConfigs';
import { TABLE_STYLES, useTableSelection, SortIcon, SelectionBanner, CheckboxHeader, CheckboxCell, TableEmptyState } from '@/app/components/ui/table-primitives';

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
  const { selectedIds: selectedGoalIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected, isPartialSelected } = useTableSelection(goals);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Use centralized status badge config (eliminates duplicate config)
  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.text} border-0 text-2xs px-1.5 py-0.5 flex items-center gap-1 font-medium whitespace-nowrap`}>
        <Icon className="w-3 h-3" />
        <span>{status.replace('_', ' ')}</span>
      </Badge>
    );
  };

  // Get priority badge with colorful styling
  const getPriorityBadge = (priority: string) => {
    const config = getPriorityConfig(priority);
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0 text-2xs px-1.5 py-0.5 font-medium whitespace-nowrap`}>
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

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-h-0 gap-2">
      <SelectionBanner
        count={selectedGoalIds.size}
        onBulkDelete={onBulkDelete ? () => onBulkDelete(Array.from(selectedGoalIds)) : undefined}
        onClear={clearSelection}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <CheckboxHeader isAllSelected={isAllSelected} isPartialSelected={isPartialSelected} onToggle={toggleSelectAll} />
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '18%' }}
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Title</span>
                    <SortIcon column="title" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '10%' }}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <SortIcon column="status" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '8%' }}
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Priority</span>
                    <SortIcon column="priority" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '9%' }}
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    <SortIcon column="dueDate" sortKey={sortColumn} sortDir={sortDirection} />
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
                      <SortIcon column="employee" sortKey={sortColumn} sortDir={sortDirection} />
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
                      <SortIcon column="manager" sortKey={sortColumn} sortDir={sortDirection} />
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
                    <SortIcon column="category" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th className={TABLE_STYLES.th} style={{ width: '7%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {goals.length === 0 ? (
                <TableEmptyState colSpan={7 + (showEmployee ? 1 : 0) + (showManager ? 1 : 0)} icon={<BsBullseye className="w-5 h-5 text-secondary" />} title="No goals found" subtitle="Try adjusting your filters to see more results" />
              ) : (
                sortedGoals.map((goal) => {
                  const isSelected = selectedGoalIds.has(goal.id);
                  return (
                    <tr
                      key={goal.id}
                      className={`border-b border-theme hover:bg-surface-secondary/50 transition-colors whitespace-nowrap ${
                        isSelected ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500' : ''
                      }`}
                    >
                      <CheckboxCell checked={isSelected} onToggle={() => toggleSelect(goal.id)} />
                      <td
                        className="py-2 px-3 cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        <div className="max-w-xs">
                          <div className="text-xs font-medium text-primary truncate">{goal.title}</div>
                          <div className="text-xs text-secondary truncate mt-0.5">{goal.description}</div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {getStatusBadge(goal.status)}
                      </td>
                      <td className="py-2 px-3">
                        {getPriorityBadge(goal.priority || 'MEDIUM')}
                      </td>
                      <td
                        className="py-2 px-3 text-xs text-primary whitespace-nowrap cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </td>
                      {showEmployee && (
                        <td
                          className="py-2 px-3 text-xs text-primary truncate cursor-pointer"
                          onClick={() => onGoalClick?.(goal)}
                        >
                          {goal.employee?.name || <span className="text-secondary">Unassigned</span>}
                        </td>
                      )}
                      {showManager && (
                        <td
                          className="py-2 px-3 text-xs text-primary truncate cursor-pointer"
                          onClick={() => onGoalClick?.(goal)}
                        >
                          {(() => {
                            const isSelfCreated = goal.employee &&
                              (!goal.manager ||
                               !goal.managerId ||
                               goal.managerId === null ||
                               goal.managerId === '');

                            if (isSelfCreated) {
                              return <span className="text-info">Self-Created</span>;
                            }
                            return goal.manager?.name || <span className="text-secondary">Unassigned</span>;
                          })()}
                        </td>
                      )}
                      <td
                        className="py-2 px-3 text-xs text-primary whitespace-nowrap cursor-pointer"
                        onClick={() => onGoalClick?.(goal)}
                      >
                        {goal.category}
                      </td>
                      <td className="py-2 px-3 text-xs" onClick={(e) => e.stopPropagation()}>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(goal)}
                            className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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

