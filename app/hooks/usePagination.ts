import { useState, useCallback } from 'react';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  pagination: PaginationMeta | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setPagination: (meta: PaginationMeta | null) => void;
  resetPage: () => void;
  paginationProps: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  } | null;
}

/**
 * Reusable pagination state hook.
 * Returns page/limit state + pagination meta + props ready for the Pagination component.
 */
export function usePagination({
  initialPage = 1,
  initialLimit = 20,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const resetPage = useCallback(() => setPage(1), []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPage(1); // Reset to first page when limit changes
  }, []);

  const paginationProps = pagination
    ? {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev,
        onPageChange: setPage,
        onLimitChange: setLimit,
      }
    : null;

  return {
    page,
    limit,
    pagination,
    setPage,
    setLimit,
    setPagination,
    resetPage,
    paginationProps,
  };
}
