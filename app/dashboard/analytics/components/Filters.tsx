'use client';

import { BsCalendar, BsPerson, BsBuilding, BsFiletypeJson, BsArrowClockwise } from 'react-icons/bs';
import { Download, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface FiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  selectedEmployee: string;
  onEmployeeChange: (employeeId: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  employees: Array<{ id: string; name: string; email: string; department: string | null }>;
  departments: string[];
  onExport: (format: 'json') => void;
  userRole?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function Filters(props: FiltersProps) {
  const {
    startDate,
    endDate,
    selectedEmployee,
    selectedDepartment,
    employees,
    departments,
    onStartDateChange,
    onEndDateChange,
    onEmployeeChange,
    onDepartmentChange,
    onExport,
    userRole,
    onRefresh,
    refreshing = false
  } = props;

  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const isAdmin = userRole === 'ADMIN' || userRole === 'MANAGER';
  const hasDateRange = startDate && endDate;

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await onExport('json');
    } finally {
      setTimeout(() => setExportLoading(false), 1000);
    }
  };

  /** --------------------------------
   * Helper function for dynamic styles
   -----------------------------------*/
  const employeeBorderColor = selectedEmployee !== 'all' ? 'border-cyan-500/50' : 'border-gray-700';
  const employeeBgColor = selectedEmployee !== 'all' ? 'bg-cyan-500/10' : 'bg-gray-900/50';
  const employeeTextColor = selectedEmployee !== 'all' ? 'text-cyan-300' : 'text-white';

  const departmentBorderColor = selectedDepartment !== 'all' ? 'border-purple-500/50' : 'border-gray-700';
  const departmentBgColor = selectedDepartment !== 'all' ? 'bg-purple-500/10' : 'bg-gray-900/50';
  const departmentTextColor = selectedDepartment !== 'all' ? 'text-purple-300' : 'text-white';

  const dateBorderColor = hasDateRange ? 'border-blue-500/50' : 'border-gray-700';
  const dateBgColor = hasDateRange ? 'bg-blue-500/10' : 'bg-gray-900/50';

  /** --------------------------------
   * JSX Rendering
   -----------------------------------*/
  return (
    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-4 border-b border-gray-700/50">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BsCalendar className="w-5 h-5 text-blue-400" />
            Filters & Export
          </h3>
          <p className="text-xs text-gray-400 mt-1">Customize your analytics view and export data</p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {onRefresh && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 backdrop-blur-sm text-blue-300 rounded-lg border border-blue-500/30 hover:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <BsArrowClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={exportLoading}
            className="px-4 py-2 bg-gray-700/60 hover:bg-gray-700/80 backdrop-blur-sm text-gray-300 rounded-lg border border-gray-600/50 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500/50 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <BsFiletypeJson className={`w-4 h-4 ${exportLoading ? 'animate-pulse' : ''}`} />
            <span>Download JSON</span>
          </motion.button>
        </div>
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* EMPLOYEE FILTER */}
        {isAdmin && employees.length > 0 && (
          <FilterSelect
            label="Employee"
            icon={<BsPerson className="w-4 h-4" />}
            leftIcon={<BsPerson className="w-3.5 h-3.5 text-gray-300" />}
            value={selectedEmployee}
            onChange={(v) => onEmployeeChange(v)}
            options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
            borderColor={employeeBorderColor}
            bgColor={employeeBgColor}
            textColor={employeeTextColor}
            focusColor="cyan-500"
            defaultLabel="All Employees"
          />
        )}

        {/* DATE RANGE */}
        <div className="space-y-3">
          <Label icon={<BsCalendar className="w-4 h-4" />} text="Date Range" />

          <div className="flex flex-col sm:flex-row gap-3">
            <DateInput
              value={startDate}
              onChange={onStartDateChange}
              placeholder="Start date"
              borderColor={dateBorderColor}
              bgColor={dateBgColor}
            />

            <span className="text-gray-400 text-sm font-semibold text-center self-center px-3 whitespace-nowrap">to</span>

            <DateInput
              value={endDate}
              onChange={onEndDateChange}
              placeholder="End date"
              borderColor={dateBorderColor}
              bgColor={dateBgColor}
            />
          </div>
        </div>

        {/* DEPARTMENT FILTER */}
        {isAdmin && departments.length > 0 && (
          <FilterSelect
            label="Department"
            icon={<BsBuilding className="w-4 h-4" />}
            leftIcon={<BsBuilding className="w-3.5 h-3.5 text-gray-300" />}
            value={selectedDepartment}
            onChange={(v) => onDepartmentChange(v)}
            options={departments.map((dept) => ({ value: dept, label: dept }))}
            borderColor={departmentBorderColor}
            bgColor={departmentBgColor}
            textColor={departmentTextColor}
            focusColor="purple-500"
            defaultLabel="All Departments"
          />
        )}

      </div>
    </div>
  );
}

/** --------------------------------
 * Reusable Components
 -----------------------------------*/

const Label = ({ icon, text }: { icon?: React.ReactNode; text: string }) => (
  <label className="text-xs font-medium text-gray-400 flex items-center gap-2 mb-2">
    {icon} {text}
  </label>
);

const FilterSelect = ({
  label,
  icon,
  leftIcon,
  value,
  onChange,
  options,
  borderColor,
  bgColor,
  textColor,
  focusColor,
  defaultLabel
}: {
  label: string;
  icon: React.ReactNode;
  leftIcon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  borderColor: string;
  bgColor: string;
  textColor: string;
  focusColor: string;
  defaultLabel: string;
}) => (
  <div className="space-y-3">
    <Label icon={icon} text={label} />

    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
        <div className="p-1.5 bg-gray-700/50 rounded-md">{leftIcon}</div>
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-12 pr-10 py-3 ${bgColor} ${textColor} rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-${focusColor} focus:ring-${focusColor} text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          color: value !== 'all' ? undefined : 'rgb(209 213 219)'
        }}
      >
        <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>{defaultLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

const DateInput = ({ value, onChange, placeholder, borderColor, bgColor }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  borderColor: string;
  bgColor: string;
}) => (
  <div className="relative flex-1" style={{ minWidth: '180px' }}>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full pl-4 pr-12 py-3 ${bgColor} text-white rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-blue-500 focus:ring-blue-500 text-sm font-medium transition-all duration-200 hover:border-opacity-70`}
    />
    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none z-10">
      <BsCalendar className="w-4 h-4 text-gray-400" />
    </div>
  </div>
);

const ActionButton = ({ text, icon, onClick, disabled }: {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    disabled={disabled}
    onClick={onClick}
    className="flex-1 px-4 py-3 bg-gray-900/60 hover:bg-gray-900/80 backdrop-blur-sm text-white rounded-lg border border-gray-700/50 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-gray-500 focus:border-gray-600 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
  >
    <span className="flex-shrink-0">{icon}</span>
    <span>{text}</span>
  </motion.button>
);
