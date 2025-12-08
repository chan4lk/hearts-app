import { BsFilter, BsPerson, BsFlag } from 'react-icons/bs';

interface EmployeeFilterProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  selectedPriority?: string;
  onPriorityChange?: (value: string) => void;
  employeeStats: Array<{
    id: string;
    name: string;
    pendingGoals: number;
  }>;
}

// Status configuration matching system colors
const STATUS_CONFIG = {
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
  }
};

// Priority configuration
const PRIORITY_CONFIG = {
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

export default function EmployeeFilter({
  selectedEmployee,
  onEmployeeChange,
  selectedStatus = '',
  onStatusChange,
  selectedPriority = '',
  onPriorityChange,
  employeeStats
}: EmployeeFilterProps) {
  const selectedStatusConfig = selectedStatus && STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    ? STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    : null;

  // Status filter styling - matching dashboard filter dark theme
  const statusBorderColor = selectedStatusConfig
    ? selectedStatusConfig.borderColor.replace('/30', '/50')
    : 'border-gray-700';

  const statusBgColor = selectedStatusConfig
    ? selectedStatusConfig.bgColor
    : 'bg-gray-900/50';

  const statusTextColor = selectedStatusConfig
    ? selectedStatusConfig.textColor
    : 'text-white';

  const statusIconGradient = selectedStatusConfig
    ? selectedStatusConfig.gradient
    : 'from-amber-500 to-orange-500';

  const statusFocusColor = selectedStatusConfig
    ? selectedStatus === 'DRAFT'
      ? 'focus:border-gray-500 focus:ring-gray-500'
      : selectedStatus === 'APPROVED'
      ? 'focus:border-emerald-500 focus:ring-emerald-500'
      : selectedStatus === 'REJECTED'
      ? 'focus:border-rose-500 focus:ring-rose-500'
      : 'focus:border-amber-500 focus:ring-amber-500'
    : 'focus:border-amber-500 focus:ring-amber-500';

  // Priority filter styling
  const selectedPriorityConfig = selectedPriority && PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG]
    ? PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG]
    : null;

  const priorityBorderColor = selectedPriorityConfig
    ? selectedPriorityConfig.borderColor.replace('/30', '/50')
    : 'border-gray-700';

  const priorityBgColor = selectedPriorityConfig
    ? selectedPriorityConfig.bgColor
    : 'bg-gray-900/50';

  const priorityTextColor = selectedPriorityConfig
    ? selectedPriorityConfig.textColor
    : 'text-white';

  const priorityIconGradient = selectedPriorityConfig
    ? selectedPriorityConfig.gradient
    : 'from-violet-500 to-purple-500';

  // Employee filter styling - matching dashboard filter
  const employeeBorderColor = selectedEmployee !== 'all'
    ? 'border-cyan-500/50'
    : 'border-gray-700';

  const employeeBgColor = selectedEmployee !== 'all'
    ? 'bg-cyan-500/10'
    : 'bg-gray-900/50';

  const employeeTextColor = selectedEmployee !== 'all'
    ? 'text-cyan-300'
    : 'text-white';

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {/* Status Filter */}
      {onStatusChange && (
        <div className="relative w-full sm:w-auto sm:min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${statusIconGradient}`}>
              <BsFilter className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-md border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${statusFocusColor} text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedStatusConfig ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Statuses</option>
            <option value="DRAFT" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Draft</option>
            <option value="APPROVED" style={{ backgroundColor: '#1f2937', color: '#6ee7b7' }}>Approved</option>
            <option value="REJECTED" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Rejected</option>
          </select>
        </div>
      )}

      {/* Priority Filter */}
      {onPriorityChange && (
        <div className="relative w-full sm:w-auto sm:min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${priorityIconGradient}`}>
              <BsFlag className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${priorityBgColor} ${priorityTextColor} rounded-lg border ${priorityBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-violet-500 focus:ring-violet-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedPriorityConfig ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Priorities</option>
            <option value="LOW" style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}>Low</option>
            <option value="MEDIUM" style={{ backgroundColor: '#1f2937', color: '#fcd34d' }}>Medium</option>
            <option value="HIGH" style={{ backgroundColor: '#1f2937', color: '#fb923c' }}>High</option>
            <option value="URGENT" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Urgent</option>
          </select>
        </div>
      )}

      {/* Employee Filter */}
      <div className="relative w-full sm:w-auto sm:max-w-xs">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
          <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md">
            <BsPerson className="w-3 h-3 text-white" />
          </div>
        </div>
        <select
          value={selectedEmployee}
          onChange={(e) => onEmployeeChange(e.target.value)}
          className={`w-full pl-10 pr-8 py-2.5 ${employeeBgColor} ${employeeTextColor} rounded-md border ${employeeBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-cyan-500 focus:ring-cyan-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.75rem center',
            color: selectedEmployee !== 'all' ? undefined : 'rgb(209 213 219)'
          }}
        >
          <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Employees</option>
          {employeeStats.map(emp => (
            <option
              key={emp.id}
              value={emp.id}
              style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}
            >
              {emp.name} ({emp.pendingGoals} pending)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 