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
  // Only show pagination when there are more items than the limit
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
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}>
      <div className="text-[13px] text-secondary">
        <span className="font-medium text-primary">{start}-{end}</span> of <span className="font-medium text-primary">{total}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {showLimitSelector && onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            className="h-8 px-2 text-[12px] bg-surface-secondary border border-theme rounded-lg text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 mr-2"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>{opt} / page</option>
            ))}
          </select>
        )}

        <button
          onClick={() => hasPrev && onPageChange(page - 1)}
          disabled={!hasPrev}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-theme text-secondary hover:text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((pageNum, index) => {
          if (pageNum === '...') {
            return <span key={`e-${index}`} className="px-1.5 text-tertiary text-[12px]">...</span>;
          }
          const n = pageNum as number;
          return (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={`h-8 min-w-[2rem] px-2 text-[12px] font-medium rounded-lg transition-colors cursor-pointer ${
                n === page
                  ? 'bg-indigo-600 text-white'
                  : 'border border-theme text-secondary hover:text-primary hover:bg-surface-secondary'
              }`}
            >
              {n}
            </button>
          );
        })}

        <button
          onClick={() => hasNext && onPageChange(page + 1)}
          disabled={!hasNext}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-theme text-secondary hover:text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
