'use client';

import { useState, useEffect } from 'react';
import { Filters } from '../types';
import { BsSearch, BsFilter, BsFunnel, BsPerson } from 'react-icons/bs';
import { Role } from '@prisma/client';

interface UserFiltersProps {
  onFilterChange: (filters: Filters) => void;
  onSearch: (searchTerm: string) => void;
  managers: Array<{ id: string; name: string; role: Role }>;
  currentUserRole?: Role;
}

// Create a mapping for display names
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Employee'
};

export default function UserFilters({ onFilterChange, onSearch, managers, currentUserRole }: UserFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    role: '',
    status: '',
    manager: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

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
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, onSearch]);

  const handleFilterChange = (name: keyof Filters, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <BsSearch className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 text-sm text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {/* Role Filter */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <BsFunnel className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="pl-10 pr-10 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 text-sm text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-200 appearance-none cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              <option value="">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_DISPLAY_NAMES[role]}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <BsFilter className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          {/* Manager Filter */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <BsPerson className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <select
              value={filters.manager}
              onChange={(e) => handleFilterChange('manager', e.target.value)}
              className="pl-10 pr-10 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 text-sm text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-200 appearance-none cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              <option value="">All Managers</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({ROLE_DISPLAY_NAMES[manager.role]})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <BsFilter className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <BsFunnel className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors duration-200" />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="pl-10 pr-10 py-2 rounded-xl bg-white/60 dark:bg-gray-800/60 text-sm text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all duration-200 appearance-none cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/80"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <BsFilter className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </div>
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