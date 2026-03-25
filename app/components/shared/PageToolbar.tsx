'use client';

import { ReactNode } from 'react';
import { BsSearch, BsPlus, BsDownload, BsXCircle } from 'react-icons/bs';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'export';
  icon?: ReactNode;
  disabled?: boolean;
}

interface PageToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ActionButton[];
  children?: ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

const BTN: Record<string, string> = {
  primary: 'bg-accent text-[rgb(var(--color-text-inverse))] hover:opacity-90 shadow-sm shadow-[rgb(var(--color-accent))]/15',
  secondary: 'bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary',
  danger: 'bg-error-muted text-error hover:opacity-90',
  export: 'bg-success-muted text-success hover:opacity-90',
};

export default function PageToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions = [],
  children,
  onClearFilters,
  hasActiveFilters = false,
}: PageToolbarProps) {
  return (
    <div className="flex items-center gap-2 py-2.5 overflow-x-auto">
      {/* Search */}
      {onSearchChange && (
        <div className="relative shrink-0 w-[180px] sm:w-[240px]">
          <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-xs bg-surface-secondary border border-theme rounded-xl text-primary placeholder:text-tertiary focus-ring transition-all duration-200"
          />
        </div>
      )}

      {/* Separator */}
      {onSearchChange && children && (
        <div className="w-px h-5 bg-[rgb(var(--color-border-primary))] shrink-0 opacity-50" />
      )}

      {/* Filters */}
      {children}

      {/* Clear */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-error bg-error-muted border border-[rgba(var(--color-error),0.15)] rounded-xl hover:opacity-80 transition-all duration-200 cursor-pointer focus-ring"
        >
          <BsXCircle className="w-3 h-3" />
          Clear
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-2" />

      {/* Actions */}
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-ring hover:-translate-y-px active:translate-y-0 ${BTN[action.variant || 'primary']}`}
        >
          {action.icon || (action.variant === 'export' ? <BsDownload className="w-3 h-3" /> : <BsPlus className="w-3.5 h-3.5" />)}
          <span className="hidden sm:inline">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Reusable Filter Select ─────────────────────────────────────
export function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'All',
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  label?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 h-9 px-3 pr-8 text-xs font-medium bg-surface-secondary border border-theme rounded-xl text-primary cursor-pointer focus-ring transition-all duration-200 appearance-none hover:border-[rgba(var(--color-accent),0.2)]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
      title={label}
      aria-label={label || placeholder}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
