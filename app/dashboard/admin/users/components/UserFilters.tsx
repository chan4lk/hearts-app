'use client';

import { useState, useEffect } from 'react';
import { Filters } from '@/app/components/shared/types';
import { BsSearch, BsFilter, BsFunnel, BsPerson } from 'react-icons/bs';
import { Role } from '.prisma/client';

interface UserFiltersProps {
  onFilterChangeAction: (filters: Filters) => void;
  onSearchAction: (searchTerm: string) => void;
  managers: Array<{ id: string; name: string; role: Role }>;
  currentUserRole?: Role;
}

// Create a mapping for display names
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Employee'
};

export default function UserFilters({ onFilterChangeAction, onSearchAction, managers, currentUserRole }: UserFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    role: '',
    status: '',
    manager: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter available roles based on current user's role
  const availableRoles = Object.values(Role).filter(role => {
    if (currentUserRole === Role.ADMIN) return true;
    if (currentUserRole === Role.MANAGER) {
      return role !== Role.ADMIN;
    }
    return role === Role.EMPLOYEE;
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearchAction(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearchAction]);

  const handleFilterChange = (name: keyof Filters, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChangeAction(newFilters);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-black/20 rounded-lg text-sm text-white placeholder-gray-400"
            placeholder="Search users..."
          />
          <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Role Filter */}
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
          className="w-full sm:w-40 px-3 py-2.5 sm:py-2 bg-black/20 rounded-lg text-sm text-white"
        >
          <option value="">All Roles</option>
          {availableRoles.map((role: Role) => (
            <option key={role.toString()} value={role}>
              {ROLE_DISPLAY_NAMES[role]}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full sm:w-40 px-3 py-2.5 sm:py-2 bg-black/20 rounded-lg text-sm text-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Active Filters */}
      {(filters.role || filters.status || filters.manager || searchTerm) && (
        <div className="flex flex-wrap gap-2">
          {filters.role && (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium backdrop-blur-sm border border-indigo-500/20">
              <span>{ROLE_DISPLAY_NAMES[filters.role as Role]}</span>
              <button
                onClick={() => handleFilterChange('role', '')}
                className="hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {filters.manager && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium backdrop-blur-sm border border-amber-500/20">
              <span>
                {managers.find(m => m.id === filters.manager)?.name || 'Unknown Manager'}
              </span>
              <button
                onClick={() => handleFilterChange('manager', '')}
                className="hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {filters.status && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium backdrop-blur-sm border border-emerald-500/20">
              <span>{filters.status}</span>
              <button
                onClick={() => handleFilterChange('status', '')}
                className="hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          {searchTerm && (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium backdrop-blur-sm border border-purple-500/20">
              <span>"{searchTerm}"</span>
              <button
                onClick={() => setSearchTerm('')}
                className="hover:text-purple-900 dark:hover:text-purple-200 transition-colors"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}