'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BsFilter, BsPerson, BsFlag, BsFolder2Open, BsChevronDown, BsSearch } from 'react-icons/bs';
import { motion } from 'framer-motion';
import { User as UserType } from '@/app/components/shared/types';
import { CATEGORIES } from '@/app/components/shared/constants';

interface FiltersProps {
  selectedUser: string;
  onUserChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedPriority?: string;
  onPriorityChange?: (value: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
  users: UserType[];
}

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
  PENDING: {
    label: 'Pending',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-300',
    gradient: 'from-amber-500 to-orange-500'
  }
};

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

interface SearchableSelectOption {
  value: string;
  label: string;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  iconGradient = 'from-blue-500 to-indigo-500',
  icon
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  iconGradient?: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = [
    { value: 'all', label: placeholder },
    ...options.filter(o =>
      o.label.toLowerCase().includes(search.toLowerCase())
    )
  ];

  const selected = value === 'all' ? null : options.find(o => o.value === value);

  const updateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (open) {
      updateDropdownPosition();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setSearch('');
    };
    const handleScroll = () => { updateDropdownPosition(); };
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [open, updateDropdownPosition]);

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-gray-700 flex items-center gap-2">
        <BsSearch className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white text-xs">✕</button>
        )}
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-sm text-gray-500 text-center">No users found</div>
        ) : (
          filtered.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); setSearch(''); }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                value === option.value
                  ? 'bg-blue-600/30 text-blue-300'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
        <div className={`p-1.5 rounded-md bg-gradient-to-r ${iconGradient}`}>
          {icon}
        </div>
      </div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(prev => !prev)}
        title={selected ? selected.label : placeholder}
        className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-left transition-all duration-200 hover:border-opacity-70 flex items-center justify-between overflow-hidden"
      >
        <span className={`truncate ${selected ? 'text-white' : 'text-gray-300'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <BsChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Tooltip for full name */}
      {selected && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 border border-gray-700">
          {selected.label}
        </div>
      )}
      {typeof window !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

export default function Filters({
  selectedUser,
  onUserChange,
  selectedStatus,
  onStatusChange,
  selectedPriority = '',
  onPriorityChange,
  selectedCategory = '',
  onCategoryChange,
  users
}: FiltersProps) {
  const selectedStatusConfig = selectedStatus && selectedStatus !== 'all' && STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    ? STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG]
    : null;

  const statusBorderColor = selectedStatusConfig ? selectedStatusConfig.borderColor.replace('/30', '/50') : 'border-gray-700';
  const statusBgColor = selectedStatusConfig ? selectedStatusConfig.bgColor : 'bg-gray-900/50';
  const statusTextColor = selectedStatusConfig ? selectedStatusConfig.textColor : 'text-white';
  const statusIconGradient = selectedStatusConfig ? selectedStatusConfig.gradient : 'from-amber-500 to-orange-500';

  const selectedPriorityConfig = selectedPriority && PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG]
    ? PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG]
    : null;

  const priorityBorderColor = selectedPriorityConfig ? selectedPriorityConfig.borderColor.replace('/30', '/50') : 'border-gray-700';
  const priorityBgColor = selectedPriorityConfig ? selectedPriorityConfig.bgColor : 'bg-gray-900/50';
  const priorityTextColor = selectedPriorityConfig ? selectedPriorityConfig.textColor : 'text-white';
  const priorityIconGradient = selectedPriorityConfig ? selectedPriorityConfig.gradient : 'from-violet-500 to-purple-500';

  const hasAllOptionalFilters = onPriorityChange && onCategoryChange;
  const hasOptionalFilters = onPriorityChange || onCategoryChange;

  let gridCols = 'md:grid-cols-2';
  if (hasOptionalFilters) gridCols = 'md:grid-cols-3 lg:grid-cols-3';
  if (hasAllOptionalFilters) gridCols = 'md:grid-cols-3 lg:grid-cols-4';

  const userOptions: SearchableSelectOption[] = users
    .filter(u => u.role !== 'ADMIN')
    .map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50"
    >
      <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
        {/* User Filter — searchable */}
        <SearchableSelect
          value={selectedUser}
          onChange={onUserChange}
          options={userOptions}
          placeholder="All Users"
          iconGradient="from-blue-500 to-indigo-500"
          icon={<BsPerson className="w-3 h-3 text-white" />}
        />

        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${statusIconGradient}`}>
              <BsFilter className="w-3 h-3 text-white" />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-lg border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              color: selectedStatusConfig ? undefined : 'rgb(209 213 219)'
            }}
          >
            <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Statuses</option>
            <option value="DRAFT" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>Draft</option>
            <option value="PENDING" style={{ backgroundColor: '#1f2937', color: '#fcd34d' }}>Pending</option>
            <option value="APPROVED" style={{ backgroundColor: '#1f2937', color: '#6ee7b7' }}>Approved</option>
            <option value="REJECTED" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Rejected</option>
            <option value="COMPLETED" style={{ backgroundColor: '#1f2937', color: '#86efac' }}>Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        {onPriorityChange && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <div className={`p-1.5 rounded-md bg-gradient-to-r ${priorityIconGradient}`}>
                <BsFlag className="w-3 h-3 text-white" />
              </div>
            </div>
            <select
              value={selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 ${priorityBgColor} ${priorityTextColor} rounded-lg border ${priorityBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-violet-500 focus:ring-violet-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
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

        {/* Category Filter */}
        {onCategoryChange && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <div className="p-1.5 rounded-md bg-gradient-to-r from-purple-500 to-indigo-500">
                <BsFolder2Open className="w-3 h-3 text-white" />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center'
              }}
            >
              <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value} style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </motion.div>
  );
}
