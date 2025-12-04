import { BsSearch, BsFilter, BsPerson, BsFolder2Open } from 'react-icons/bs';
import { EmployeeStats } from '@/app/components/shared/types';

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  selectedGoalType?: string;
  setSelectedGoalType?: (type: string) => void;
  employees: EmployeeStats[];
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
  },
  COMPLETED: { 
    label: 'Completed', 
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-300',
    gradient: 'from-green-500 to-emerald-500'
  },
  NOT_STARTED: {
    label: 'Not Started',
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-500 to-slate-500'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-300',
    gradient: 'from-blue-500 to-cyan-500'
  },
  ON_HOLD: {
    label: 'On Hold',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-300',
    gradient: 'from-amber-500 to-orange-500'
  },
  BLOCKED: {
    label: 'Blocked',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-300',
    gradient: 'from-red-500 to-rose-500'
  }
};

export default function Filters({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedEmployee,
  setSelectedEmployee,
  selectedGoalType = 'all',
  setSelectedGoalType,
  employees
}: FiltersProps) {
  const selectedStatusConfig = selectedStatus && STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    ? STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    : null;

  const statusBorderColor = selectedStatusConfig
    ? selectedStatusConfig.borderColor.replace('/30', '/50')
    : 'border-gray-700';
  
  const statusBgColor = selectedStatusConfig
    ? selectedStatusConfig.bgColor
    : 'bg-gray-900/50';

  const statusTextColor = selectedStatusConfig
    ? selectedStatusConfig.textColor
    : 'text-white';

  const statusFocusColor = selectedStatusConfig
    ? selectedStatus === 'DRAFT' || selectedStatus === 'NOT_STARTED' 
      ? 'focus:border-gray-500 focus:ring-gray-500'
      : selectedStatus === 'APPROVED' 
      ? 'focus:border-emerald-500 focus:ring-emerald-500'
      : selectedStatus === 'REJECTED' 
      ? 'focus:border-rose-500 focus:ring-rose-500'
      : selectedStatus === 'COMPLETED' 
      ? 'focus:border-green-500 focus:ring-green-500'
      : selectedStatus === 'IN_PROGRESS' 
      ? 'focus:border-blue-500 focus:ring-blue-500'
      : selectedStatus === 'ON_HOLD' 
      ? 'focus:border-amber-500 focus:ring-amber-500'
      : selectedStatus === 'BLOCKED' 
      ? 'focus:border-red-500 focus:ring-red-500'
      : 'focus:border-amber-500 focus:ring-amber-500'
    : 'focus:border-amber-500 focus:ring-amber-500';

  const statusIconGradient = selectedStatusConfig
    ? selectedStatusConfig.gradient
    : 'from-amber-500 to-orange-500';

  // Employee filter styling
  const employeeBorderColor = selectedEmployee !== 'all'
    ? 'border-cyan-500/50'
    : 'border-gray-700';

  const employeeBgColor = selectedEmployee !== 'all'
    ? 'bg-cyan-500/10'
    : 'bg-gray-900/50';

  const employeeTextColor = selectedEmployee !== 'all'
    ? 'text-cyan-300'
    : 'text-white';

  // Goal type filter styling
  const goalTypeBorderColor = selectedGoalType !== 'all'
    ? 'border-purple-500/50'
    : 'border-gray-700';

  const goalTypeBgColor = selectedGoalType !== 'all'
    ? 'bg-purple-500/10'
    : 'bg-gray-900/50';

  const goalTypeTextColor = selectedGoalType !== 'all'
    ? 'text-purple-300'
    : 'text-white';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md">
              <BsSearch className="w-3 h-3 text-white" />
            </div>
          </div>
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 text-sm font-medium transition-all duration-200 hover:border-opacity-70 hover:shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${statusIconGradient}`}>
              <BsFilter className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-lg border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${statusFocusColor} text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
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
            <option value="COMPLETED" style={{ backgroundColor: '#1f2937', color: '#86efac' }}>Completed</option>
            <option value="NOT_STARTED" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Not Started</option>
            <option value="IN_PROGRESS" style={{ backgroundColor: '#1f2937', color: '#93c5fd' }}>In Progress</option>
            <option value="ON_HOLD" style={{ backgroundColor: '#1f2937', color: '#fcd34d' }}>On Hold</option>
            <option value="BLOCKED" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Blocked</option>
          </select>
        </div>

        {/* Employee Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md">
              <BsPerson className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${employeeBgColor} ${employeeTextColor} rounded-lg border ${employeeBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-cyan-500 focus:ring-cyan-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedEmployee !== 'all' ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Employees</option>
            {/* Group by role */}
            {employees
              .filter(emp => emp.role === 'ADMIN')
              .map((employee) => (
                <option 
                  key={employee.id} 
                  value={employee.email}
                  style={{ backgroundColor: '#1f2937', color: '#fbbf24' }}
                >
                  👑 {employee.name} (Admin)
                </option>
              ))}
            {employees
              .filter(emp => emp.role === 'MANAGER')
              .map((employee) => (
                <option 
                  key={employee.id} 
                  value={employee.email}
                  style={{ backgroundColor: '#1f2937', color: '#60a5fa' }}
                >
                  👨‍💼 {employee.name} (Manager)
                </option>
              ))}
            {employees
              .filter(emp => emp.role === 'EMPLOYEE')
              .map((employee) => (
                <option 
                  key={employee.id} 
                  value={employee.email}
                  style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}
                >
                  👤 {employee.name} (Employee)
                </option>
              ))}
          </select>
        </div>

        {/* Goal Type Filter */}
        {setSelectedGoalType && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md">
                <BsFolder2Open className="w-3 h-3 text-white" />
              </div>
            </div>
            <select
              value={selectedGoalType}
              onChange={(e) => setSelectedGoalType(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 ${goalTypeBgColor} ${goalTypeTextColor} rounded-lg border ${goalTypeBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-purple-500 focus:ring-purple-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                color: selectedGoalType !== 'all' ? undefined : 'rgb(209 213 219)'
              }}
            >
              <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Goal Types</option>
              <option value="assigned" style={{ backgroundColor: '#1f2937', color: '#a78bfa' }}>Assigned Goals</option>
              <option value="self-created" style={{ backgroundColor: '#1f2937', color: '#f472b6' }}>Employee Created Self Goals</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
} 