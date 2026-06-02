'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filters } from '@/app/components/shared/types';
import { BsFilter, BsPerson, BsChevronDown, BsSearch } from 'react-icons/bs';
import { Role } from '.prisma/client';

interface FiltersProps {
  onFilterChangeAction: (filters: Filters) => void;
  onSearchAction: (searchTerm: string) => void;
  currentUserRole?: Role;
  initialFilters?: Filters;
  initialSearchTerm?: string;
}

const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Employee'
};

const ROLE_CONFIG = {
  ADMIN: { label: 'Admin', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/10', textColor: 'text-orange-300', gradient: 'from-orange-500 to-red-500' },
  MANAGER: { label: 'Manager', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10', textColor: 'text-purple-300', gradient: 'from-purple-500 to-pink-500' },
  EMPLOYEE: { label: 'Employee', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-300', gradient: 'from-emerald-500 to-teal-500' }
};

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-300', gradient: 'from-emerald-500 to-teal-500' },
  INACTIVE: { label: 'Inactive', borderColor: 'border-gray-500/30', bgColor: 'bg-gray-500/10', textColor: 'text-gray-300', gradient: 'from-gray-500 to-slate-500' }
};

interface Option { value: string; label: string; }

function SearchableSelect({ value, onChange, options, placeholder, iconGradient = 'from-blue-500 to-indigo-500', icon, searchPlaceholder = 'Search...' }: {
  value: string; onChange: (value: string) => void; options: Option[];
  placeholder: string; iconGradient?: string; icon: React.ReactNode; searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = [{ value: '', label: placeholder }, ...options];
  const filtered = allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = value === '' ? null : options.find(o => o.value === value);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 });
  }, []);

  useEffect(() => {
    if (open) { updatePosition(); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClose = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false); setSearch('');
    };
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  const dropdown = open ? (
    <div ref={dropdownRef} style={dropdownStyle} className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-gray-700 flex items-center gap-2">
        <BsSearch className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder} className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white text-xs">✕</button>}
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0
          ? <div className="px-3 py-3 text-sm text-gray-500 text-center">No results found</div>
          : filtered.map(option => (
            <button key={option.value} type="button"
              onClick={() => { onChange(option.value); setOpen(false); setSearch(''); }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${value === option.value ? 'bg-blue-600/30 text-blue-300' : 'text-gray-300 hover:bg-gray-700'}`}>
              {option.label}
            </button>
          ))
        }
      </div>
    </div>
  ) : null;

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
        <div className={`p-1.5 rounded-md bg-gradient-to-r ${iconGradient}`}>{icon}</div>
      </div>
      <button ref={buttonRef} type="button" onClick={() => setOpen(p => !p)} title={selected ? selected.label : placeholder}
        className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-left transition-all duration-200 hover:border-opacity-70 flex items-center justify-between overflow-hidden">
        <span className={`truncate ${selected ? 'text-white' : 'text-gray-300'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <BsChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {selected && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 border border-gray-700">
          {selected.label}
        </div>
      )}
      {typeof window !== 'undefined' && dropdown && createPortal(dropdown, document.body)}
    </div>
  );
}

export default function UserFilters({
  onFilterChangeAction,
  onSearchAction,
  currentUserRole,
  initialFilters,
  initialSearchTerm = ''
}: FiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters || { role: '', status: '', manager: '' });
  const [selectedUserName, setSelectedUserName] = useState(initialSearchTerm);
  const [allUsers, setAllUsers] = useState<Option[]>([]);

  // Fetch minimal users list for the dropdown
  useEffect(() => {
    fetch('/api/admin/users?minimal=true&limit=1000&page=1')
      .then(r => r.ok ? r.json() : { users: [] })
      .then(data => {
        const users = Array.isArray(data) ? data : (data.users || []);
        setAllUsers(users.map((u: any) => ({
          value: u.name,
          label: `${u.name} (${u.role})`
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialFilters) setFilters(initialFilters);
  }, [initialFilters?.role, initialFilters?.status, initialFilters?.manager]);

  useEffect(() => {
    if (initialSearchTerm !== undefined) setSelectedUserName(initialSearchTerm);
  }, [initialSearchTerm]);

  const availableRoles = Object.values(Role).filter(role => {
    if (currentUserRole === Role.ADMIN) return true;
    if (currentUserRole === Role.MANAGER) return role !== Role.ADMIN;
    return role === Role.EMPLOYEE;
  });

  const handleFilterChange = (name: keyof Filters, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChangeAction(newFilters);
  };

  const handleUserSelect = (name: string) => {
    setSelectedUserName(name);
    onSearchAction(name);
  };

  const selectedRoleConfig = filters.role && ROLE_CONFIG[filters.role as keyof typeof ROLE_CONFIG]
    ? ROLE_CONFIG[filters.role as keyof typeof ROLE_CONFIG] : null;

  const roleBorderColor = selectedRoleConfig ? selectedRoleConfig.borderColor.replace('/30', '/50') : 'border-gray-700';
  const roleBgColor = selectedRoleConfig ? selectedRoleConfig.bgColor : 'bg-gray-900/50';
  const roleTextColor = selectedRoleConfig ? selectedRoleConfig.textColor : 'text-white';
  const roleIconGradient = selectedRoleConfig ? selectedRoleConfig.gradient : 'from-blue-500 to-indigo-500';

  const selectedStatusConfig = filters.status && STATUS_CONFIG[filters.status as keyof typeof STATUS_CONFIG]
    ? STATUS_CONFIG[filters.status as keyof typeof STATUS_CONFIG] : null;

  const statusBorderColor = selectedStatusConfig ? selectedStatusConfig.borderColor.replace('/30', '/50') : 'border-gray-700';
  const statusBgColor = selectedStatusConfig ? selectedStatusConfig.bgColor : 'bg-gray-900/50';
  const statusTextColor = selectedStatusConfig ? selectedStatusConfig.textColor : 'text-white';
  const statusIconGradient = selectedStatusConfig ? selectedStatusConfig.gradient : 'from-amber-500 to-orange-500';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* User searchable dropdown — replaces separate search input */}
        <SearchableSelect
          value={selectedUserName}
          onChange={handleUserSelect}
          options={allUsers}
          placeholder="All Users"
          iconGradient="from-blue-500 to-indigo-500"
          icon={<BsPerson className="w-3 h-3 text-white" />}
          searchPlaceholder="Search users..."
        />

        {/* Role Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${roleIconGradient}`}>
              <BsPerson className="w-3 h-3 text-white" />
            </div>
          </div>
          <select value={filters.role} onChange={e => handleFilterChange('role', e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${roleBgColor} ${roleTextColor} rounded-lg border ${roleBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', color: selectedRoleConfig ? undefined : 'rgb(209 213 219)' }}>
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
          <select value={filters.status || ''} onChange={e => handleFilterChange('status', e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-lg border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-amber-500 focus:border-amber-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', color: selectedStatusConfig ? undefined : 'rgb(209 213 219)' }}>
            <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Status</option>
            <option value="ACTIVE" style={{ backgroundColor: '#1f2937', color: '#6ee7b7' }}>Active</option>
            <option value="INACTIVE" style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}>Inactive</option>
          </select>
        </div>

      </div>
    </div>
  );
}
