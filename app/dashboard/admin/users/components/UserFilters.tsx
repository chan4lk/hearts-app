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
    <div className="bg-[#1E2028] rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BsSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#2D3748] text-white border border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsFilter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-[#2D3748] text-white border border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsFilter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-[#2D3748] text-white border border-[#4A5568] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.role && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
            <span>Role: {ROLES[filters.role as keyof typeof ROLES]}</span>
            <button
              onClick={() => handleFilterChange('role', '')}
              className="hover:text-blue-300"
            >
              ×
            </button>
          </div>
        )}
        {filters.status && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            <span>Status: {filters.status}</span>
            <button
              onClick={() => handleFilterChange('status', '')}
              className="hover:text-green-300"
            >
              ×
            </button>
          </div>
        )}
        {filters.manager && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
            <span>Manager: {filters.manager}</span>
            <button
              onClick={() => handleFilterChange('manager', '')}
              className="hover:text-yellow-300"
            >
              ×
            </button>
          </div>
        )}
        {searchTerm && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
            <span>Search: {searchTerm}</span>
            <button
              onClick={() => setSearchTerm('')}
              className="hover:text-purple-300"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}