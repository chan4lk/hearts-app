'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BsPerson, BsChevronDown, BsSearch } from 'react-icons/bs';

interface User {
  id: string;
  name: string;
  email: string;
}

interface EmployeeFilterProps {
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  assignedEmployees: User[];
}

export function EmployeeFilter({ selectedEmployee, onEmployeeChange, assignedEmployees }: EmployeeFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = assignedEmployees.map(e => ({ value: e.id, label: e.name }));
  const allOptions = [{ value: 'all', label: 'All Employees' }, ...options];
  const filtered = allOptions.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = selectedEmployee === 'all' ? null : options.find(o => o.value === selectedEmployee);

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
              onClick={() => { onEmployeeChange(o.value); setOpen(false); setSearch(''); }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${selectedEmployee === o.value ? 'bg-cyan-600/30 text-cyan-300' : 'text-gray-300 hover:bg-gray-700'}`}>
              {o.label}
            </button>
          ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative group w-full sm:w-auto sm:max-w-xs">
      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
        <div className="p-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-md">
          <BsPerson className="w-3 h-3 text-white" />
        </div>
      </div>
      <button ref={btnRef} type="button" onClick={() => setOpen(p => !p)} title={selected ? selected.label : 'All Employees'}
        className="w-full pl-10 pr-8 py-2.5 bg-gray-900/50 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm font-medium text-left transition-all duration-200 hover:border-opacity-70 flex items-center justify-between overflow-hidden">
        <span className={`truncate ${selected ? 'text-cyan-300' : 'text-gray-300'}`}>
          {selected ? selected.label : 'All Employees'}
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
