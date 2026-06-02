'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BsFilter, BsPerson, BsFolder2Open, BsFlag, BsChevronDown, BsSearch } from 'react-icons/bs';
import { EmployeeStats } from '@/app/components/shared/types';

interface FiltersProps {
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employee: string) => void;
  selectedGoalType?: string;
  setSelectedGoalType?: (type: string) => void;
  selectedPriority?: string;
  setSelectedPriority?: (priority: string) => void;
  employees: EmployeeStats[];
  actions?: React.ReactNode;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', borderColor: 'border-gray-500/30', bgColor: 'bg-gray-500/10', textColor: 'text-gray-300', gradient: 'from-gray-500 to-slate-500' },
  APPROVED: { label: 'Approved', borderColor: 'border-emerald-500/30', bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-300', gradient: 'from-emerald-500 to-teal-500' },
  REJECTED: { label: 'Rejected', borderColor: 'border-rose-500/30', bgColor: 'bg-rose-500/10', textColor: 'text-rose-300', gradient: 'from-rose-500 to-red-500' },
  COMPLETED: { label: 'Completed', borderColor: 'border-green-500/30', bgColor: 'bg-green-500/10', textColor: 'text-green-300', gradient: 'from-green-500 to-emerald-500' },
  NOT_STARTED: { label: 'Not Started', borderColor: 'border-gray-500/30', bgColor: 'bg-gray-500/10', textColor: 'text-gray-300', gradient: 'from-gray-500 to-slate-500' },
  IN_PROGRESS: { label: 'In Progress', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10', textColor: 'text-blue-300', gradient: 'from-blue-500 to-cyan-500' },
  ON_HOLD: { label: 'On Hold', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/10', textColor: 'text-amber-300', gradient: 'from-amber-500 to-orange-500' },
  BLOCKED: { label: 'Blocked', borderColor: 'border-red-500/30', bgColor: 'bg-red-500/10', textColor: 'text-red-300', gradient: 'from-red-500 to-rose-500' }
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', borderColor: 'border-gray-500/30', bgColor: 'bg-gray-500/10', textColor: 'text-gray-300', gradient: 'from-gray-400 to-gray-500' },
  MEDIUM: { label: 'Medium', borderColor: 'border-yellow-500/30', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-300', gradient: 'from-yellow-400 to-orange-500' },
  HIGH: { label: 'High', borderColor: 'border-orange-500/30', bgColor: 'bg-orange-500/10', textColor: 'text-orange-300', gradient: 'from-orange-400 to-red-500' },
  URGENT: { label: 'Urgent', borderColor: 'border-red-500/30', bgColor: 'bg-red-500/10', textColor: 'text-red-300', gradient: 'from-red-400 to-red-600' }
};

interface Option { value: string; label: string; }

function SearchableSelect({ value, onChange, options, placeholder, iconGradient = 'from-cyan-500 to-blue-500', icon }: {
  value: string; onChange: (v: string) => void; options: Option[];
  placeholder: string; iconGradient?: string; icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = [{ value: 'all', label: placeholder }, ...options];
  const filtered = allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = value === 'all' ? null : options.find(o => o.value === value);

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 });
  }, []);

  useEffect(() => { if (open) { updatePos(); setTimeout(() => inputRef.current?.focus(), 50); } }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (dropRef.current?.contains(e.target as Node)) return;
      setOpen(false); setSearch('');
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('scroll', updatePos, true); window.removeEventListener('resize', updatePos); };
  }, [open, updatePos]);

  const dropdown = open ? (
    <div ref={dropRef} style={style} className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
      <div className="p-2 border-b border-gray-700 flex items-center gap-2">
        <BsSearch className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employees..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500" />
        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white text-xs">✕</button>}
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0
          ? <div className="px-3 py-3 text-sm text-gray-500 text-center">No employees found</div>
          : filtered.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${value === o.value ? 'bg-cyan-600/30 text-cyan-300' : 'text-gray-300 hover:bg-gray-700'}`}>
              {o.label}
            </button>
          ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
        <div className={`p-1.5 rounded-md bg-gradient-to-r ${iconGradient}`}>{icon}</div>
      </div>
      <button ref={btnRef} type="button" onClick={() => setOpen(p => !p)} title={selected ? selected.label : placeholder}
        className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm font-medium text-left transition-all duration-200 hover:border-opacity-70 flex items-center justify-between overflow-hidden">
        <span className={`truncate ${selected ? 'text-cyan-300' : 'text-gray-300'}`}>
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

export default function Filters({
  selectedStatus, setSelectedStatus, selectedEmployee, setSelectedEmployee,
  selectedGoalType = 'all', setSelectedGoalType, selectedPriority = '', setSelectedPriority, employees, actions
}: FiltersProps) {
  const selectedStatusConfig = selectedStatus && STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG] ? STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG] : null;
  const statusBorderColor = selectedStatusConfig ? selectedStatusConfig.borderColor.replace('/30', '/50') : 'border-gray-700';
  const statusBgColor = selectedStatusConfig ? selectedStatusConfig.bgColor : 'bg-gray-900/50';
  const statusTextColor = selectedStatusConfig ? selectedStatusConfig.textColor : 'text-white';
  const statusFocusColor = selectedStatusConfig
    ? selectedStatus === 'APPROVED' ? 'focus:border-emerald-500 focus:ring-emerald-500'
    : selectedStatus === 'REJECTED' ? 'focus:border-rose-500 focus:ring-rose-500'
    : selectedStatus === 'COMPLETED' ? 'focus:border-green-500 focus:ring-green-500'
    : selectedStatus === 'IN_PROGRESS' ? 'focus:border-blue-500 focus:ring-blue-500'
    : selectedStatus === 'ON_HOLD' ? 'focus:border-amber-500 focus:ring-amber-500'
    : selectedStatus === 'BLOCKED' ? 'focus:border-red-500 focus:ring-red-500'
    : 'focus:border-amber-500 focus:ring-amber-500'
    : 'focus:border-amber-500 focus:ring-amber-500';
  const statusIconGradient = selectedStatusConfig ? selectedStatusConfig.gradient : 'from-amber-500 to-orange-500';

  const selectedPriorityConfig = selectedPriority && PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG] ? PRIORITY_CONFIG[selectedPriority as keyof typeof PRIORITY_CONFIG] : null;
  const priorityBorderColor = selectedPriorityConfig ? selectedPriorityConfig.borderColor.replace('/30', '/50') : 'border-gray-700';
  const priorityBgColor = selectedPriorityConfig ? selectedPriorityConfig.bgColor : 'bg-gray-900/50';
  const priorityTextColor = selectedPriorityConfig ? selectedPriorityConfig.textColor : 'text-white';
  const priorityIconGradient = selectedPriorityConfig ? selectedPriorityConfig.gradient : 'from-violet-500 to-purple-500';

  const goalTypeBorderColor = selectedGoalType !== 'all' ? 'border-purple-500/50' : 'border-gray-700';
  const goalTypeBgColor = selectedGoalType !== 'all' ? 'bg-purple-500/10' : 'bg-gray-900/50';
  const goalTypeTextColor = selectedGoalType !== 'all' ? 'text-purple-300' : 'text-white';

  const employeeOptions: Option[] = [
    ...employees.filter(e => e.role === 'ADMIN').map(e => ({ value: e.email, label: `👑 ${e.name} (Admin)` })),
    ...employees.filter(e => e.role === 'MANAGER').map(e => ({ value: e.email, label: `👨‍💼 ${e.name} (Manager)` })),
    ...employees.filter(e => e.role === 'EMPLOYEE').map(e => ({ value: e.email, label: `👤 ${e.name} (Employee)` })),
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border-2 border-gray-700/50">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <div className={`p-1.5 rounded-md bg-gradient-to-r ${statusIconGradient}`}><BsFilter className="w-3 h-3 text-white" /></div>
          </div>
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className={`w-full pl-10 pr-8 py-2.5 ${statusBgColor} ${statusTextColor} rounded-lg border ${statusBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${statusFocusColor} text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', color: selectedStatusConfig ? undefined : 'rgb(209 213 219)' }}>
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

        {/* Employee Filter — searchable */}
        <SearchableSelect
          value={selectedEmployee}
          onChange={setSelectedEmployee}
          options={employeeOptions}
          placeholder="All Employees"
          iconGradient="from-cyan-500 to-blue-500"
          icon={<BsPerson className="w-3 h-3 text-white" />}
        />

        {/* Goal Type Filter */}
        {setSelectedGoalType && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md"><BsFolder2Open className="w-3 h-3 text-white" /></div>
            </div>
            <select value={selectedGoalType} onChange={e => setSelectedGoalType(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 ${goalTypeBgColor} ${goalTypeTextColor} rounded-lg border ${goalTypeBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-purple-500 focus:ring-purple-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', color: selectedGoalType !== 'all' ? undefined : 'rgb(209 213 219)' }}>
              <option value="all" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Goal Types</option>
              <option value="assigned" style={{ backgroundColor: '#1f2937', color: '#a78bfa' }}>Assigned Goals</option>
              <option value="self-created" style={{ backgroundColor: '#1f2937', color: '#f472b6' }}>Employee Created Self Goals</option>
            </select>
          </div>
        )}

        {/* Priority Filter */}
        {setSelectedPriority && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
              <div className={`p-1.5 rounded-md bg-gradient-to-r ${priorityIconGradient}`}><BsFlag className="w-3 h-3 text-white" /></div>
            </div>
            <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 ${priorityBgColor} ${priorityTextColor} rounded-lg border ${priorityBorderColor} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-violet-500 focus:ring-violet-500 text-sm font-medium appearance-none cursor-pointer transition-all duration-200`}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', color: selectedPriorityConfig ? undefined : 'rgb(209 213 219)' }}>
              <option value="" style={{ backgroundColor: '#1f2937', color: '#d1d5db' }}>All Priorities</option>
              <option value="LOW" style={{ backgroundColor: '#1f2937', color: '#9ca3af' }}>Low</option>
              <option value="MEDIUM" style={{ backgroundColor: '#1f2937', color: '#fcd34d' }}>Medium</option>
              <option value="HIGH" style={{ backgroundColor: '#1f2937', color: '#fb923c' }}>High</option>
              <option value="URGENT" style={{ backgroundColor: '#1f2937', color: '#fca5a5' }}>Urgent</option>
            </select>
          </div>
        )}

        {/* Actions slot (e.g. AI Insights button) */}
        {actions && <div className="flex items-center justify-end">{actions}</div>}
      </div>
    </div>
  );
}
