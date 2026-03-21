'use client';

import { useState, useCallback } from 'react';

interface PaginationState {
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

export function usePagination({ initialPage = 1, initialLimit = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit) || 1;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNext) setPage(p => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage(p => p - 1);
  }, [hasPrev]);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const updateFromResponse = useCallback((paginationData: { total?: number; totalPages?: number }) => {
    if (paginationData.total !== undefined) setTotal(paginationData.total);
  }, []);

  const pagination: PaginationState = {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };

  return {
    pagination,
    page,
    limit,
    setPage: goToPage,
    setLimit,
    nextPage,
    prevPage,
    resetPage,
    updateFromResponse,
    // For building query params
    skip: (page - 1) * limit,
    queryParams: { page: String(page), limit: String(limit) },
  };
}
