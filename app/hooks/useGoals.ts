'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePagination } from './usePagination';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  department: string;
  progress: number;
  dueDate: string;
  createdAt: string;
  employeeId: string;
  managerId?: string | null;
  employee?: { id: string; name: string; email: string };
  manager?: { id: string; name: string; email: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
  updatedBy?: { id: string; name: string; email: string } | null;
  rating?: {
    id: string;
    selfScore: number | null;
    selfComments: string | null;
    managerScore: number | null;
    managerComments: string | null;
    selfRatedAt: string | null;
    managerRatedAt: string | null;
  } | null;
  [key: string]: unknown;
}

interface GoalStats {
  total: number;
  completed: number;
  pending: number;
  approved: number;
  draft: number;
  rejected: number;
  modified: number;
  rated: number;
  unrated: number;
  categories?: Record<string, number>;
}

interface UseGoalsOptions {
  view?: 'my-goals' | 'team-goals' | 'pending-approval' | 'all';
  initialLimit?: number;
  autoFetch?: boolean;
}

interface GoalFilters {
  status: string;
  category: string;
  priority: string;
  employeeId: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

export function useGoals({ view, initialLimit = 20, autoFetch = true }: UseGoalsOptions = {}) {
  const { data: session, status: sessionStatus } = useSession();
  const pag = usePagination({ initialLimit });

  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<GoalFilters>({
    status: 'all',
    category: 'all',
    priority: 'all',
    employeeId: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchGoals = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user) return;

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      setError(null);
      setLoading(true);

      const params = new URLSearchParams({
        page: String(pag.page),
        limit: String(pag.limit),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (view) params.append('view', view);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.employeeId !== 'all') params.append('employeeId', filters.employeeId);
      if (filters.search.trim()) params.append('search', filters.search.trim());

      const response = await fetch(`/api/goals?${params}`, {
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error('Failed to fetch goals');

      const data = await response.json();
      setGoals(data.goals || []);
      setStats(data.stats || null);
      pag.updateFromResponse(data.pagination || {});
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [sessionStatus, session?.user, pag.page, pag.limit, filters, view]);

  // Auto-fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch && sessionStatus === 'authenticated') {
      fetchGoals();
    }
    return () => { abortRef.current?.abort(); };
  }, [fetchGoals, autoFetch, sessionStatus]);

  const updateFilter = useCallback((key: keyof GoalFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    pag.resetPage();
  }, [pag]);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      category: 'all',
      priority: 'all',
      employeeId: 'all',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    pag.resetPage();
  }, [pag]);

  const hasActiveFilters = filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.employeeId !== 'all' ||
    filters.search.trim() !== '';

  return {
    goals,
    stats,
    loading,
    error,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    pagination: pag.pagination,
    setPage: pag.setPage,
    refetch: fetchGoals,
  };
}
