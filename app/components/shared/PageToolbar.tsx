'use client';

import { ReactNode, useState } from 'react';
import { BsSearch, BsPlus, BsDownload, BsXCircle, BsFunnel } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const hasFilters = !!children;

  return (
    <div className="space-y-2">
      {/* Main toolbar row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        {onSearchChange && (
          <div className="relative shrink-0 flex-1 sm:flex-none sm:w-[240px]">
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

        {/* Desktop filters (hidden on mobile) */}
        {hasFilters && (
          <div className="hidden sm:flex items-center gap-2">
            {onSearchChange && (
              <div className="w-px h-5 bg-[rgb(var(--color-border-primary))] shrink-0 opacity-50" />
            )}
            {children}
          </div>
        )}

        {/* Mobile filter toggle (shown on mobile when filters exist) */}
        {hasFilters && (
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className={`sm:hidden shrink-0 inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-xl border transition-all focus-ring ${
              mobileFiltersOpen || hasActiveFilters
                ? 'bg-accent-muted border-[rgb(var(--color-accent))]/20 text-accent'
                : 'bg-surface-secondary border-theme text-secondary'
            }`}
            aria-label="Toggle filters"
          >
            <BsFunnel className="w-3.5 h-3.5" />
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>
        )}

        {/* Clear */}
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-error bg-error-muted border border-[rgba(var(--color-error),0.15)] rounded-xl hover:opacity-80 transition-all duration-200 cursor-pointer focus-ring"
          >
            <BsXCircle className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-2 hidden sm:block" />

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

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && hasFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-surface-secondary rounded-xl border border-theme">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
