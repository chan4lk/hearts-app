'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export interface AnalyticsData {
  summary: {
    totalGoals: number;
    completedGoals: number;
    completionRate: number;
    averageRating: number;
    ratedGoals: number;
    ratingCompletionRate: number;
    overdueGoals: number;
    totalUsers: number;
  };
  breakdowns: {
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  trends: {
    monthly: Record<string, number>;
  };
  employeePerformance: Array<{
    employeeId: string;
    employeeName: string;
    totalGoals: number;
    completedGoals: number;
    averageRating: number;
    completionRate: number;
  }>;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

const EMPTY_DATA: AnalyticsData = {
  summary: { totalGoals: 0, completedGoals: 0, completionRate: 0, averageRating: 0, ratedGoals: 0, ratingCompletionRate: 0, overdueGoals: 0, totalUsers: 0 },
  breakdowns: { byStatus: {}, byCategory: {}, byPriority: {}, byDepartment: {} },
  trends: { monthly: {} },
  employeePerformance: [],
};

const MAX_RETRIES = 3;

export function useAnalyticsData() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Refs for dedup and retry
  const lastFilterKey = useRef('');
  const hasData = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  type DashboardType = 'employee' | 'manager' | 'admin';

  // Dashboard type
  const dashboardType: DashboardType = useMemo(() => {
    if (sessionStatus === 'loading' || !session?.user) return 'employee' as const;

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ctx = params.get('context');
      if (ctx === 'admin' || ctx === 'manager' || ctx === 'employee') return ctx;

      const stored = sessionStorage.getItem('dashboardContext');
      if (stored === 'admin' || stored === 'manager' || stored === 'employee') return stored;
    }

    const role = session.user.role;
    if (role === 'MANAGER') return 'manager' as const;
    if (role === 'EMPLOYEE') return 'employee' as const;
    return 'admin' as const;
  }, [session?.user?.role, sessionStatus]);

  // Fetch employee list (admin/manager only)
  const fetchEmployees = useCallback(async () => {
    if (!session?.user) return;
    try {
      let response;
      if (session.user.role === 'ADMIN') {
        response = await fetch('/api/admin/users?minimal=true&limit=1000&page=1&sortBy=name&sortOrder=asc');
      } else if (session.user.role === 'MANAGER') {
        response = await fetch('/api/employees/assigned');
      } else {
        return;
      }
      if (!response.ok) return;

      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.employees || data.users || []);

      setEmployees(list.map((e: any) => ({ id: e.id, name: e.name, email: e.email, department: e.department || null })));
      setDepartments(
        Array.from(new Set(list.map((e: any) => e.department).filter(Boolean) as string[])).sort()
      );
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, [session?.user]);

  // Core fetch
  const fetchAnalytics = useCallback(async () => {
    if (sessionStatus !== 'authenticated' || !session?.user) return;

    try {
      setError(null);
      if (!hasData.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = new URLSearchParams({ startDate, endDate, context: dashboardType });
      const role = session.user.role;
      if (role === 'ADMIN' || role === 'MANAGER') {
        if (selectedEmployee !== 'all') params.append('employeeId', selectedEmployee);
        if (selectedDepartment !== 'all') params.append('department', selectedDepartment);
      }

      const response = await fetch(`/api/analytics/dashboard?${params}`);

      if (!response.ok) {
        if (response.status === 503) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Database connection limit reached.');
        }
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      if (data.success) {
        const sanitized: AnalyticsData = {
          summary: {
            totalGoals: data.summary?.totalGoals || 0,
            completedGoals: data.summary?.completedGoals || 0,
            completionRate: data.summary?.completionRate || 0,
            averageRating: data.summary?.averageRating || 0,
            ratedGoals: data.summary?.ratedGoals || 0,
            ratingCompletionRate: data.summary?.ratingCompletionRate || 0,
            overdueGoals: data.summary?.overdueGoals || 0,
            totalUsers: data.summary?.totalUsers || 0,
          },
          breakdowns: {
            byStatus: data.breakdowns?.byStatus || {},
            byCategory: data.breakdowns?.byCategory || {},
            byPriority: data.breakdowns?.byPriority || {},
            byDepartment: data.breakdowns?.byDepartment || {},
          },
          trends: { monthly: data.trends?.monthly || {} },
          employeePerformance: data.employeePerformance || [],
        };
        setAnalyticsData(sanitized);
        hasData.current = true;
        retryCount.current = 0;
        lastFilterKey.current = `${startDate}-${endDate}-${selectedEmployee}-${selectedDepartment}-${dashboardType}`;
      } else {
        setAnalyticsData(EMPTY_DATA);
        hasData.current = true;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Retry on connection errors, with a cap
      if ((msg.includes('connection limit') || msg.includes('too many clients')) && retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        console.warn(`Retrying analytics fetch (${retryCount.current}/${MAX_RETRIES})...`);
        setTimeout(() => fetchAnalytics(), 2000 * retryCount.current);
        return;
      }

      console.error('Error fetching analytics:', err);
      setError(msg);
      setAnalyticsData(EMPTY_DATA);
      hasData.current = true;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionStatus, session?.user, startDate, endDate, selectedEmployee, selectedDepartment, dashboardType]);

  // Initial load
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      router.push('/login');
      return;
    }

    if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
      fetchEmployees();
    }
    lastFilterKey.current = '';
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  // Refetch on filter change (debounced)
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user || !hasData.current) return;

    const key = `${startDate}-${endDate}-${selectedEmployee}-${selectedDepartment}-${dashboardType}`;
    if (lastFilterKey.current === key) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastFilterKey.current = '';
      fetchAnalytics();
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [startDate, endDate, selectedEmployee, selectedDepartment, dashboardType, fetchAnalytics, sessionStatus, session?.user]);

  const handleRefresh = useCallback(() => {
    retryCount.current = 0;
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleClearFilters = useCallback(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedEmployee('all');
    setSelectedDepartment('all');
  }, []);

  return {
    session,
    sessionStatus,
    loading,
    refreshing,
    error,
    analyticsData,
    dashboardType,
    // Filters
    startDate, setStartDate,
    endDate, setEndDate,
    selectedEmployee, setSelectedEmployee,
    selectedDepartment, setSelectedDepartment,
    employees,
    departments,
    // Actions
    handleRefresh,
    handleClearFilters,
  };
}
