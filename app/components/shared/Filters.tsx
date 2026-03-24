'use client';

import { BsFilter, BsPerson, BsFlag, BsFolder2Open, BsCalendar, BsDownload, BsArrowClockwise, BsArrowCounterclockwise, BsBuilding } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', textColor: 'text-secondary' },
  APPROVED: { label: 'Approved', textColor: 'text-success' },
  REJECTED: { label: 'Rejected', textColor: 'text-error' },
  COMPLETED: { label: 'Completed', textColor: 'text-info' },
  PENDING: { label: 'Pending', textColor: 'text-warning' }
};

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', textColor: 'text-secondary' },
  MEDIUM: { label: 'Medium', textColor: 'text-warning' },
  HIGH: { label: 'High', textColor: 'text-error' },
  URGENT: { label: 'Urgent', textColor: 'text-error' }
};

export const CATEGORY_CONFIG = {
  PROFESSIONAL: { label: 'Professional' },
  TECHNICAL: { label: 'Technical' },
  LEADERSHIP: { label: 'Leadership' },
  PERSONAL: { label: 'Personal' },
  TRAINING: { label: 'Training' },
  KPI: { label: 'KPI' }
};

export interface FilterOption {
  value: string;
  label: string;
}

export interface FiltersProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  selectedUser?: string;
  onUserChange?: (value: string) => void;
  users?: Array<{ id: string; name: string; role: string }>;
  selectedEmployee?: string;
  onEmployeeChange?: (value: string) => void;
  employees?: Array<{ id: string; name: string; email: string; department?: string | null }>;
  assignedEmployees?: Array<{ id: string; name: string; role: string }>;
  selectedDepartment?: string;
  onDepartmentChange?: (value: string) => void;
  departments?: string[];
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  selectedPriority?: string;
  onPriorityChange?: (value: string) => void;
  priorityOptions?: FilterOption[];
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
  categoryOptions?: FilterOption[];
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    icon?: ReactNode;
  }>;
  onExport?: () => void;
  userRole?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onClear?: () => void;
  onClose?: () => void;
}

const FilterSelect = ({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: ReactNode;
}) => {
  return (
    <div className="relative">
      {icon !== undefined && (
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
          <div className="p-1.5 rounded-md bg-accent">
            {icon || <BsPerson className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
          </div>
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon !== undefined ? 'pl-10' : 'pl-3'} pr-8 py-2.5 bg-surface-secondary text-primary rounded-lg border border-theme focus-ring text-sm font-medium appearance-none cursor-pointer transition-all duration-150 hover:bg-surface-tertiary`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center'
        }}
      >
        <option value="all" className="bg-surface-secondary text-primary">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface-secondary text-primary">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default function Filters({
  startDate, endDate, onStartDateChange, onEndDateChange,
  selectedUser = 'all', onUserChange, users = [],
  selectedEmployee = 'all', onEmployeeChange, employees = [], assignedEmployees = [],
  selectedDepartment = 'all', onDepartmentChange, departments = [],
  selectedStatus = 'all', onStatusChange, statusOptions,
  selectedPriority = '', onPriorityChange, priorityOptions,
  selectedCategory = '', onCategoryChange, categoryOptions,
  filters = [],
  onExport, userRole, onRefresh, refreshing = false, onClear,
}: FiltersProps) {
  const activeFiltersCount = [
    onStartDateChange, onUserChange, onEmployeeChange, onDepartmentChange,
    onStatusChange, onPriorityChange, onCategoryChange
  ].filter(Boolean).length + filters.length;

  const getAutoGridClass = (count: number) => {
    if (count <= 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-3';
    if (count <= 4) return 'grid grid-cols-2 lg:grid-cols-4 gap-3';
    return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3';
  };

  const employeeOptions = employees.length > 0
    ? employees.map(e => ({ value: e.id, label: e.name }))
    : assignedEmployees.map(e => ({ value: e.id, label: e.name }));

  const defaultStatusOptions = statusOptions || [
    { value: 'DRAFT', label: 'Draft' }, { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  const defaultPriorityOptions = priorityOptions || [
    { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' }, { value: 'URGENT', label: 'Urgent' }
  ];

  const defaultCategoryOptions = categoryOptions || [
    { value: 'PROFESSIONAL', label: 'Professional' }, { value: 'TECHNICAL', label: 'Technical' },
    { value: 'LEADERSHIP', label: 'Leadership' }, { value: 'PERSONAL', label: 'Personal' },
    { value: 'TRAINING', label: 'Training' }, { value: 'KPI', label: 'KPI' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface-elevated rounded-xl p-4 border border-theme space-y-4"
    >
      <div className="flex gap-2 items-start">
        <div className={`flex-1 ${getAutoGridClass(activeFiltersCount)}`}>
          {onStartDateChange && onEndDateChange && (
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
                  <div className="p-1.5 rounded-md bg-accent">
                    <BsCalendar className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />
                  </div>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-surface-secondary text-primary rounded-lg border border-theme focus-ring text-sm font-medium transition-all duration-150"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-surface-secondary text-primary rounded-lg border border-theme focus-ring text-sm font-medium transition-all duration-150"
                />
              </div>
            </div>
          )}

          {onUserChange && users.length > 0 && (
            <FilterSelect
              value={selectedUser}
              onChange={onUserChange}
              options={users.filter(u => u.role !== 'ADMIN').map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
              icon={<BsPerson className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
            />
          )}

          {onEmployeeChange && employeeOptions.length > 0 && (
            <FilterSelect
              value={selectedEmployee}
              onChange={onEmployeeChange}
              options={employeeOptions}
              icon={<BsPerson className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
            />
          )}

          {onDepartmentChange && departments.length > 0 && (
            <FilterSelect
              value={selectedDepartment}
              onChange={onDepartmentChange}
              options={departments.map(d => ({ value: d, label: d }))}
              icon={<BsBuilding className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
            />
          )}

          {onStatusChange && (
            <FilterSelect
              value={selectedStatus}
              onChange={onStatusChange}
              options={defaultStatusOptions}
              icon={<BsFilter className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
            />
          )}

          {onPriorityChange && (
            <FilterSelect
              value={selectedPriority}
              onChange={onPriorityChange}
              options={defaultPriorityOptions}
              icon={<BsFlag className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
            />
          )}

          {onCategoryChange && (
            <FilterSelect
              value={selectedCategory}
              onChange={onCategoryChange}
              options={defaultCategoryOptions}
              icon={<BsFolder2Open className="w-3 h-3 text-[rgb(var(--color-text-inverse))]" />}
            />
          )}

          {filters.map((filter) => (
            <FilterSelect
              key={filter.id}
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              icon={filter.icon || undefined}
            />
          ))}
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="shrink-0 px-3 py-2 rounded-lg bg-surface-secondary text-secondary hover:text-primary hover:bg-surface-tertiary border border-theme transition-all duration-150 flex items-center gap-2 focus-ring"
            title="Clear Filters"
          >
            <BsArrowCounterclockwise className="w-5 h-5" />
          </button>
        )}
      </div>

      {(onExport || onRefresh) && (
        <div className="flex justify-end gap-3 pt-2 border-t border-theme">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-secondary text-primary hover:bg-surface-tertiary border border-theme transition-colors disabled:opacity-50 focus-ring"
            >
              <BsArrowClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          {onExport && (userRole === 'ADMIN' || userRole === 'MANAGER') && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-[rgb(var(--color-text-inverse))] hover:opacity-90 transition-colors focus-ring"
            >
              <BsDownload className="w-4 h-4" />
              Export Report
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
