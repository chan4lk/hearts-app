'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  showLimitSelector?: boolean;
  className?: string;
}

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onLimitChange,
  limitOptions = [20, 50, 100],
  showLimitSelector = true,
  className = ''
}: PaginationProps) {
  if (total <= limit && page === 1) return null;
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 ${className}`}>
      <div className="text-xs text-secondary tabular-nums">
        Showing <span className="font-semibold text-primary">{start}-{end}</span> of <span className="font-semibold text-primary">{total}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        {showLimitSelector && onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            className="h-9 px-2.5 text-xs bg-surface-secondary border border-theme rounded-xl text-primary cursor-pointer focus-ring mr-2 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%239CA3AF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '24px',
            }}
            aria-label="Items per page"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>{opt} / page</option>
            ))}
          </select>
        )}

        <button
          onClick={() => hasPrev && onPageChange(page - 1)}
          disabled={!hasPrev}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-theme text-secondary hover:text-primary hover:bg-surface-secondary hover:border-[rgba(var(--color-accent),0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus-ring"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((pageNum, index) => {
          if (pageNum === '...') {
            return <span key={`e-${index}`} className="px-1 text-tertiary text-xs select-none">...</span>;
          }
          const n = pageNum as number;
          return (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={`h-9 min-w-[2.25rem] px-2.5 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer focus-ring ${
                n === page
                  ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-md shadow-[rgb(var(--color-accent))]/20'
                  : 'border border-theme text-secondary hover:text-primary hover:bg-surface-secondary hover:border-[rgba(var(--color-accent),0.2)]'
              }`}
              aria-label={`Page ${n}`}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          );
        })}

        <button
          onClick={() => hasNext && onPageChange(page + 1)}
          disabled={!hasNext}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-theme text-secondary hover:text-primary hover:bg-surface-secondary hover:border-[rgba(var(--color-accent),0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer focus-ring"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
