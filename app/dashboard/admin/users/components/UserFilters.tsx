'use client';

import { useState, useEffect } from 'react';
import { Filters, ROLES } from '../types';
import { BsSearch, BsFilter } from 'react-icons/bs';

interface UserFiltersProps {
  onFilterChange: (filters: Filters) => void;
  onSearch: (searchTerm: string) => void;
}

export default function UserFilters({ onFilterChange, onSearch }: UserFiltersProps) {
  const [filters, setFilters] = useState<Filters>({
    role: '',
    status: '',
    manager: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

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
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/10 dark:border-gray-700/30">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <BsSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600/30 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <BsFilter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="pl-8 pr-8 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
              <option value="">All Roles</option>
              {Object.entries(ROLES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <BsFilter className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="pl-8 pr-8 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {(filters.role || filters.status || filters.manager || searchTerm) && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {filters.role && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-xs">
              <span>{ROLES[filters.role as keyof typeof ROLES]}</span>
              <button
                onClick={() => handleFilterChange('role', '')}
                className="hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                ×
              </button>
            </div>
          )}
          {filters.status && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs">
              <span>{filters.status}</span>
              <button
                onClick={() => handleFilterChange('status', '')}
                className="hover:text-green-800 dark:hover:text-green-300"
              >
                ×
              </button>
            </div>
          )}
          {filters.manager && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs">
              <span>{filters.manager}</span>
              <button
                onClick={() => handleFilterChange('manager', '')}
                className="hover:text-amber-800 dark:hover:text-amber-300"
              >
                ×
              </button>
            </div>
          )}
          {searchTerm && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-xs">
              <span>{searchTerm}</span>
              <button
                onClick={() => setSearchTerm('')}
                className="hover:text-purple-800 dark:hover:text-purple-300"
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