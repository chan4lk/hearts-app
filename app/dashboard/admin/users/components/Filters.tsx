'use client';

import { useState, useEffect } from 'react';
import { Filters } from '@/app/components/shared/types';
import { BsSearch, BsFilter, BsPerson } from 'react-icons/bs';
import { Role } from '.prisma/client';

interface FiltersProps {
  onFilterChangeAction: (filters: Filters) => void;
  onSearchAction: (searchTerm: string) => void;
  currentUserRole?: Role;
  initialFilters?: Filters;
  initialSearchTerm?: string;
}

// Create a mapping for display names
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Employee'
};

// Role configuration for styling
const ROLE_CONFIG = {
  ADMIN: {
    label: 'Admin',
    borderColor: 'border-orange-500/30',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-300',
    gradient: 'from-orange-500 to-red-500'
  },
  MANAGER: {
    label: 'Manager',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-300',
    gradient: 'from-purple-500 to-pink-500'
  },
  EMPLOYEE: {
    label: 'Employee',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-300',
    gradient: 'from-emerald-500 to-teal-500'
  }
};

// Status configuration
const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-300',
    gradient: 'from-emerald-500 to-teal-500'
  },
  INACTIVE: {
    label: 'Inactive',
    borderColor: 'border-gray-500/30',
    bgColor: 'bg-gray-500/10',
    textColor: 'text-gray-300',
    gradient: 'from-gray-500 to-slate-500'
  }
};

export default function UserFilters({ 
  onFilterChangeAction, 
  onSearchAction, 
  currentUserRole,
  initialFilters,
  initialSearchTerm = ''
}: FiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters || {
    role: '',
    status: '',
    manager: '' // Keep in state but not displayed in UI
  });

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  // Sync with parent component's filter state
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters?.role, initialFilters?.status, initialFilters?.manager]);

  // Sync with parent component's search term
  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  // Filter available roles based on current user's role
  const availableRoles = Object.values(Role).filter(role => {
    if (currentUserRole === Role.ADMIN) return true;
    if (currentUserRole === Role.MANAGER) {
      return role !== Role.ADMIN;
    }
    return role === Role.EMPLOYEE;
  });

  useEffect(() => {
    // Immediate update for faster UI response
    onSearchAction(searchTerm);
  }, [searchTerm, onSearchAction]);

  const handleFilterChange = (name: keyof Filters, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    // Immediate update for faster UI response
    onFilterChangeAction(newFilters);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const selectedRoleConfig = filters.role && ROLE_CONFIG[filters.role as keyof typeof ROLE_CONFIG]
    ? ROLE_CONFIG[filters.role as keyof typeof ROLE_CONFIG]
    : null;

  const roleBorderColor = selectedRoleConfig
    ? selectedRoleConfig.borderColor.replace('/30', '/50')
    : 'border-gray-700';
  const roleBgColor = selectedRoleConfig
    ? selectedRoleConfig.bgColor
    : 'bg-gray-900/50';
  const roleTextColor = selectedRoleConfig
    ? selectedRoleConfig.textColor
    : 'text-white';
  const roleIconGradient = selectedRoleConfig
    ? selectedRoleConfig.gradient
    : 'from-blue-500 to-indigo-500';

  const selectedStatusConfig = filters.status && STATUS_CONFIG[filters.status as keyof typeof STATUS_CONFIG]
    ? STATUS_CONFIG[filters.status as keyof typeof STATUS_CONFIG]
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
  const statusIconGradient = selectedStatusConfig
    ? selectedStatusConfig.gradient
    : 'from-amber-500 to-orange-500';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className="p-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500">
              <BsSearch className="w-3 h-3 text-white" />
            </div>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium placeholder-gray-400 transition-all duration-200 hover:border-opacity-70 hover:shadow-sm"
            placeholder="Search users..."
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${roleIconGradient}`}>
              <BsPerson className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${roleBgColor} ${roleTextColor} rounded-lg border ${roleBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedRoleConfig ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Roles</option>
            {availableRoles.map((role: Role) => (
              <option key={role.toString()} value={role} style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>
                {ROLE_DISPLAY_NAMES[role]}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${statusIconGradient}`}>
              <BsFilter className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-lg border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-70 hover:shadow-sm`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedStatusConfig ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Status</option>
            <option value="ACTIVE" style={{ backgroundColor: '#1f2937', color: '#6ee7b7' }}>Active</option>
            <option value="INACTIVE" style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}>Inactive</option>
          </select>
        </div>

      </div>
    </div>
  );
}

