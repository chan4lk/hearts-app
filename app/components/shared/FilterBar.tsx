'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, X } from 'lucide-react';

interface FilterBarProps {
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Search value */
  search: string;
  /** Search change handler */
  onSearchChange: (value: string) => void;
  /** Whether any filters are active (shows indicator dot) */
  hasActiveFilters?: boolean;
  /** Clear all filters handler */
  onClearAll?: () => void;
  /** Filter controls (selects, toggles, etc.) */
  children?: ReactNode;
}

export default function FilterBar({
  searchPlaceholder = 'Search...',
  search,
  onSearchChange,
  hasActiveFilters = false,
  onClearAll,
  children,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const isActive = hasActiveFilters || !!search;

  return (
    <>
      {/* Filter toggle button — render this in your page header */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium focus-ring transition-all ${
          showFilters || isActive
            ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm'
            : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {isActive && !showFilters && <span className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-inverse))]" />}
      </button>

      {/* Expandable filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="card-stat flex flex-wrap gap-3 items-center">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="input-base pl-10"
                />
              </div>

              {/* Additional filter controls */}
              {children}

              {/* Clear all */}
              {isActive && onClearAll && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-tertiary hover:text-error focus-ring rounded px-2 py-1 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Filter Select (for use inside FilterBar children) ── */
export function FilterSelect({ value, onChange, options, placeholder = 'All' }: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-select"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
