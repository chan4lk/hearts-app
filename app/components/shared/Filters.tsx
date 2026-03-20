'use client';

import { BsFilter, BsPerson, BsFlag, BsFolder2Open, BsCalendar, BsDownload, BsArrowClockwise, BsArrowCounterclockwise, BsBuilding, BsXCircle } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Status configuration matching system colors
export const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-500 to-slate-500'
  },
  APPROVED: {
    label: 'Approved',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-300',
    gradient: 'from-emerald-500 to-teal-500'
  },
  REJECTED: {
    label: 'Rejected',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-300',
    gradient: 'from-rose-500 to-red-500'
  },
  COMPLETED: {
    label: 'Completed',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-300',
    gradient: 'from-green-500 to-emerald-500'
  },
  PENDING: {
    label: 'Pending',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-300',
    gradient: 'from-amber-500 to-orange-500'
  }
};

// Priority configuration
export const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-400 to-gray-500'
  },
  MEDIUM: {
    label: 'Medium',
    borderColor: 'border-yellow-500/30',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-300',
    gradient: 'from-yellow-400 to-orange-500'
  },
  HIGH: {
    label: 'High',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-300',
    gradient: 'from-orange-400 to-red-500'
  },
  URGENT: {
    label: 'Urgent',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-300',
    gradient: 'from-red-400 to-red-600'
  }
};

// Category configuration
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
  // Date Range
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;

  // User filter
  selectedUser?: string;
  onUserChange?: (value: string) => void;
  users?: Array<{ id: string; name: string; role: string }>;
  
  // Employee filter (alias for User filter but specific for Analytics/Manager views)
  selectedEmployee?: string;
  onEmployeeChange?: (value: string) => void;
  employees?: Array<{ id: string; name: string; email: string; department?: string | null }>;
  assignedEmployees?: Array<{ id: string; name: string; role: string }>; // For Manager Set Goals

  // Department filter
  selectedDepartment?: string;
  onDepartmentChange?: (value: string) => void;
  departments?: string[];

  // Status filter
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  
  // Priority filter
  selectedPriority?: string;
  onPriorityChange?: (value: string) => void;
  priorityOptions?: FilterOption[];
  
  // Category filter
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
  categoryOptions?: FilterOption[];
  
  // Generic filters
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    icon?: ReactNode;
    gradient?: string;
  }>;

  // Actions
  onExport?: () => void;
  userRole?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onClear?: () => void;
  onClose?: () => void;
}

const getColorConfig = (value: string, config: any) => {
  const selectedConfig = value && value !== 'all' && config[value as keyof typeof config]
    ? config[value as keyof typeof config]
    : null;

  return {
    borderColor: selectedConfig
      ? selectedConfig.borderColor.replace('/30', '/50')
      : 'border-theme',
    bgColor: selectedConfig
      ? selectedConfig.bgColor
      : 'bg-surface-secondary',
    textColor: selectedConfig
      ? selectedConfig.textColor
      : 'text-primary',
    gradient: selectedConfig
      ? selectedConfig.gradient
      : 'from-amber-500 to-orange-500'
  };
};

const FilterSelect = ({
  value,
  onChange,
  options,
  icon,
  gradient = 'from-blue-500 to-indigo-500',
  bgColor = 'bg-surface-secondary',
  borderColor = 'border-theme',
  focusRing = 'focus:ring-blue-500 focus:border-blue-500'
}: {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  icon?: ReactNode;
  gradient?: string;
  bgColor?: string;
  borderColor?: string;
  focusRing?: string;
}) => {
  return (
    <div className="relative">
      {icon !== false && (
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
          <div className={`p-1.5 rounded-md bg-gradient-to-r ${gradient}`}>
            {icon || <BsPerson className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon !== false ? 'pl-10' : 'pl-3'} pr-8 py-2.5 ${bgColor} text-primary rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${focusRing} text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center'
        }}
      >
        <option value="all" className="bg-surface-secondary text-primary">
          All
        </option>
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            className="bg-surface-secondary text-primary"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default function Filters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedUser = 'all',
  onUserChange,
  users = [],
  selectedEmployee = 'all',
  onEmployeeChange,
  employees = [],
  assignedEmployees = [],
  selectedDepartment = 'all',
  onDepartmentChange,
  departments = [],
  selectedStatus = 'all',
  onStatusChange,
  statusOptions,
  selectedPriority = '',
  onPriorityChange,
  priorityOptions,
  selectedCategory = '',
  onCategoryChange,
  categoryOptions,
  filters = [],
  onExport,
  userRole,
  onRefresh,
  refreshing = false,
  onClear,
  onClose
}: FiltersProps) {
  const statusColorConfig = getColorConfig(selectedStatus, STATUS_CONFIG);
  const priorityColorConfig = getColorConfig(selectedPriority, PRIORITY_CONFIG);
  
  // Determine grid columns based on active filters (similar to StatsSection auto-grid)
  const activeFiltersCount = [
    onStartDateChange,
    onUserChange,
    onEmployeeChange,
    onDepartmentChange,
    onStatusChange,
    onPriorityChange,
    onCategoryChange
  ].filter(Boolean).length + filters.length;

  const getAutoGridClass = (count: number) => {
    if (count <= 2) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3';
    if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3';
    if (count === 4) return 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3';
    if (count === 5) return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3';
    if (count === 6) return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3';
    return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-auto gap-3 auto-cols-fr';
  };

  const gridColsClass = getAutoGridClass(activeFiltersCount);

  // Merge employees lists if needed
  const employeeOptions = employees.length > 0 
    ? employees.map(e => ({ value: e.id, label: e.name }))
    : assignedEmployees.length > 0
      ? assignedEmployees.map(e => ({ value: e.id, label: e.name }))
      : [];

  const defaultStatusOptions = statusOptions || [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  const defaultPriorityOptions = priorityOptions || [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  const defaultCategoryOptions = categoryOptions || [
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'LEADERSHIP', label: 'Leadership' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'TRAINING', label: 'Training' },
    { value: 'KPI', label: 'KPI' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-surface-elevated rounded-xl p-4 border border-theme space-y-4"
    >
      <div className="flex gap-2 items-start">
        <div className={`flex-1 ${gridColsClass}`}>
          {/* Date Range Filter */}
          {onStartDateChange && onEndDateChange && (
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500">
                    <BsCalendar className="w-3 h-3 text-white" />
                  </div>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all duration-200 hover:border-opacity-70 hover:shadow-sm"
                />
              </div>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full pl-3 pr-3 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium transition-all duration-200 hover:border-opacity-70 hover:shadow-sm"
                />
              </div>
            </div>
          )}

          {/* User Filter */}
          {onUserChange && users.length > 0 && (
            <FilterSelect
              value={selectedUser}
              onChange={onUserChange}
              options={users
                .filter(u => u.role !== 'ADMIN')
                .map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
              icon={<BsPerson className="w-3 h-3 text-white" />}
              gradient="from-blue-500 to-indigo-500"
              focusRing="focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          {/* Employee Filter */}
          {onEmployeeChange && employeeOptions.length > 0 && (
            <FilterSelect
              value={selectedEmployee}
              onChange={onEmployeeChange}
              options={employeeOptions}
              icon={<BsPerson className="w-3 h-3 text-white" />}
              gradient="from-blue-500 to-indigo-500"
              focusRing="focus:ring-blue-500 focus:border-blue-500"
            />
          )}

          {/* Department Filter */}
          {onDepartmentChange && departments.length > 0 && (
            <FilterSelect
              value={selectedDepartment}
              onChange={onDepartmentChange}
              options={departments.map(d => ({ value: d, label: d }))}
              icon={<BsBuilding className="w-3 h-3 text-white" />}
              gradient="from-indigo-500 to-purple-500"
              focusRing="focus:ring-indigo-500 focus:border-indigo-500"
            />
          )}

          {/* Status Filter */}
          {onStatusChange && (
            <FilterSelect
              value={selectedStatus}
              onChange={onStatusChange}
              options={defaultStatusOptions}
              icon={<BsFilter className="w-3 h-3 text-white" />}
              gradient={statusColorConfig.gradient}
              bgColor={statusColorConfig.bgColor}
              borderColor={statusColorConfig.borderColor}
              focusRing="focus:ring-amber-500 focus:border-amber-500"
            />
          )}

          {/* Priority Filter */}
          {onPriorityChange && (
            <FilterSelect
              value={selectedPriority}
              onChange={onPriorityChange}
              options={defaultPriorityOptions}
              icon={<BsFlag className="w-3 h-3 text-white" />}
              gradient={priorityColorConfig.gradient}
              bgColor={priorityColorConfig.bgColor}
              borderColor={priorityColorConfig.borderColor}
              focusRing="focus:ring-violet-500 focus:border-violet-500"
            />
          )}

          {/* Category Filter */}
          {onCategoryChange && (
            <FilterSelect
              value={selectedCategory}
              onChange={onCategoryChange}
              options={defaultCategoryOptions}
              icon={<BsFolder2Open className="w-3 h-3 text-white" />}
              gradient="from-purple-500 to-indigo-500"
              focusRing="focus:ring-purple-500 focus:border-purple-500"
            />
          )}

          {/* Generic Filters */}
          {filters.map((filter) => (
            <FilterSelect
              key={filter.id}
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              icon={filter.icon || undefined}
              gradient={filter.gradient || 'from-blue-500 to-indigo-500'}
              focusRing="focus:ring-blue-500 focus:border-blue-500"
            />
          ))}
        </div>

        {onClear && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClear}
            className="shrink-0 px-3 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:text-white hover:bg-gray-600/60 border border-transparent transition-all duration-200 flex items-center gap-2"
            title="Clear Filters"
          >
            <BsArrowCounterclockwise className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Action Buttons */}
      {(onExport || onRefresh) && (
        <div className="flex justify-end gap-3 pt-2 border-t border-theme">
           {onRefresh && (
             <button
               onClick={onRefresh}
               disabled={refreshing}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700/50 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
             >
               <BsArrowClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
               {refreshing ? 'Refreshing...' : 'Refresh'}
             </button>
           )}
           {onExport && (userRole === 'ADMIN' || userRole === 'MANAGER') && (
             <button
               onClick={onExport}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
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
