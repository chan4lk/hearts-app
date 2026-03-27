'use client';

import { useState, useMemo, useCallback, ReactNode } from 'react';
import { BsSquare, BsCheckSquare, BsDashSquare } from 'react-icons/bs';

// ─── Styles (single source of truth) ────────────────────────────
export const TABLE_STYLES = {
  thead: 'sticky top-0 z-20 bg-surface-secondary border-b border-theme',
  th: 'text-left py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider whitespace-nowrap select-none',
  thSortable: 'text-left py-2.5 px-3 text-xs font-semibold text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface-tertiary transition-colors whitespace-nowrap select-none',
  td: 'py-2.5 px-3',
  tdPrimary: 'py-2.5 px-3 text-xs text-primary truncate',
  tdSecondary: 'py-2.5 px-3 text-xs text-secondary truncate',
  row: 'border-b border-theme hover:bg-surface-secondary/50 transition-colors cursor-pointer',
  rowSelected: 'border-b border-theme hover:bg-surface-secondary/50 transition-colors cursor-pointer bg-accent/5',
} as const;

// ─── useTableSelection Hook ─────────────────────────────────────
export function useTableSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === items.length ? new Set() : new Set(items.map(i => i.id))
    );
  }, [items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isAllSelected = selectedIds.size === items.length && items.length > 0;
  const isPartialSelected = selectedIds.size > 0 && !isAllSelected;

  return { selectedIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected, isPartialSelected };
}

// ─── useSorting Hook ────────────────────────────────────────────
export function useSorting<T>(items: T[], defaultColumn?: string) {
  const [sortKey, setSortKey] = useState<string | null>(defaultColumn || null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  const handleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? (setSortKey(null), null) : 'asc');
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return items;
    return [...items].sort((a, b) => {
      let aVal: any = a, bVal: any = b;
      for (const k of sortKey.split('.')) { aVal = aVal?.[k]; bVal = bVal?.[k]; }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, handleSort };
}

// ─── SortIcon Component ─────────────────────────────────────────
export function SortIcon({ column, sortKey, sortDir }: { column: string; sortKey: string | null; sortDir: 'asc' | 'desc' | null }) {
  if (sortKey !== column) return <span className="text-secondary text-xs opacity-50">⇅</span>;
  return <span className="text-accent font-bold text-sm">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

// ─── CheckboxHeader ─────────────────────────────────────────────
export function CheckboxHeader({ isAllSelected, isPartialSelected, onToggle }: {
  isAllSelected: boolean;
  isPartialSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <th style={{ width: '3%' }} className="py-2.5 px-3">
      <button type="button" onClick={onToggle} className="text-secondary hover:text-primary transition-colors cursor-pointer" aria-label={isAllSelected ? 'Deselect all' : 'Select all'}>
        {isAllSelected ? (
          <BsCheckSquare className="w-4 h-4 text-accent" />
        ) : isPartialSelected ? (
          <BsDashSquare className="w-4 h-4 text-accent" />
        ) : (
          <BsSquare className="w-4 h-4" />
        )}
      </button>
    </th>
  );
}

// ─── CheckboxCell ───────────────────────────────────────────────
export function CheckboxCell({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={onToggle} className="text-secondary hover:text-primary transition-colors cursor-pointer" aria-label={checked ? 'Deselect row' : 'Select row'}>
        {checked ? <BsCheckSquare className="w-4 h-4 text-accent" /> : <BsSquare className="w-4 h-4" />}
      </button>
    </td>
  );
}

// ─── SelectionBanner ────────────────────────────────────────────
export function SelectionBanner({ count, onBulkDelete, onClear }: {
  count: number;
  onBulkDelete?: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-accent-muted border border-theme dark:border-[rgb(var(--color-accent))]/20 rounded-lg text-xs">
      <span className="font-medium text-accent">{count} selected</span>
      {onBulkDelete && (
        <button type="button" onClick={onBulkDelete} className="ml-auto text-error hover:underline font-medium cursor-pointer">Delete selected</button>
      )}
      <button type="button" onClick={onClear} className="text-secondary hover:text-primary font-medium cursor-pointer">Clear</button>
    </div>
  );
}

// ─── TableEmptyState ────────────────────────────────────────────
export function TableEmptyState({ colSpan, icon, title, subtitle }: {
  colSpan: number;
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-secondary border border-theme flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium text-primary">{title}</p>
            {subtitle && <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </td>
    </tr>
  );
}
