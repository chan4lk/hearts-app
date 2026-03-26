'use client';

import { TABLE_STYLES } from '@/app/components/ui/table-primitives';

export type SortColumn = 'title' | 'status' | 'priority' | 'dueDate' | 'employee' | 'manager' | 'category';
export type SortDirection = 'asc' | 'desc' | null;

interface GoalsTableFiltersProps {
  showEmployee: boolean;
  showManager: boolean;
  showActions: boolean;
  showRating: boolean;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

function getSortIcon(column: SortColumn, sortColumn: SortColumn | null, sortDirection: SortDirection) {
  if (sortColumn !== column) {
    return <span className="text-secondary text-xs">{'\u21C5'}</span>;
  }
  if (sortDirection === 'asc') {
    return <span className="text-accent font-bold text-sm">{'\u2191'}</span>;
  }
  if (sortDirection === 'desc') {
    return <span className="text-accent font-bold text-sm">{'\u2193'}</span>;
  }
  return <span className="text-secondary text-xs">{'\u21C5'}</span>;
}

export default function GoalsTableFilters({
  showEmployee,
  showManager,
  showActions,
  showRating,
  sortColumn,
  sortDirection,
  onSort,
}: GoalsTableFiltersProps) {
  return (
    <thead className={TABLE_STYLES.thead}>
      <tr>
        <th
          className={TABLE_STYLES.thSortable}
          style={{ width: '20%' }}
          onClick={() => onSort('title')}
        >
          <div className="flex items-center gap-1.5">
            <span>Title</span>
            {getSortIcon('title', sortColumn, sortDirection)}
          </div>
        </th>
        <th
          className={TABLE_STYLES.thSortable}
          style={{ width: '12%' }}
          onClick={() => onSort('status')}
        >
          <div className="flex items-center gap-1.5">
            <span>Status</span>
            {getSortIcon('status', sortColumn, sortDirection)}
          </div>
        </th>
        <th
          className={TABLE_STYLES.thSortable}
          style={{ width: '10%' }}
          onClick={() => onSort('priority')}
        >
          <div className="flex items-center gap-1.5">
            <span>Priority</span>
            {getSortIcon('priority', sortColumn, sortDirection)}
          </div>
        </th>
        <th
          className={TABLE_STYLES.thSortable}
          style={{ width: '12%' }}
          onClick={() => onSort('dueDate')}
        >
          <div className="flex items-center gap-1.5">
            <span>Due Date</span>
            {getSortIcon('dueDate', sortColumn, sortDirection)}
          </div>
        </th>
        {showEmployee && (
          <th
            className={TABLE_STYLES.thSortable}
            style={{ width: '12%' }}
            onClick={() => onSort('employee')}
          >
            <div className="flex items-center gap-1.5">
              <span>Employee</span>
              {getSortIcon('employee', sortColumn, sortDirection)}
            </div>
          </th>
        )}
        {showManager && (
          <th
            className={TABLE_STYLES.thSortable}
            style={{ width: '12%' }}
            onClick={() => onSort('manager')}
          >
            <div className="flex items-center gap-1.5">
              <span>Manager</span>
              {getSortIcon('manager', sortColumn, sortDirection)}
            </div>
          </th>
        )}
        <th
          className={TABLE_STYLES.thSortable}
          style={{ width: '10%' }}
          onClick={() => onSort('category')}
        >
          <div className="flex items-center gap-1.5">
            <span>Category</span>
            {getSortIcon('category', sortColumn, sortDirection)}
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
  );
}
