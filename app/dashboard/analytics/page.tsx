'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { BsBarChart, BsStarFill } from 'react-icons/bs';

import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

import { BsClipboardData, BsCheckCircle, BsPercent, BsStarFill as BsStarIcon, BsClock, BsFileEarmarkText, BsCheck2Circle, BsXCircle, BsListCheck } from 'react-icons/bs';

interface AnalyticsData {
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Role-based filters (for admin and manager)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; email: string; department: string | null }>>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Use ref to track if filters have changed to prevent duplicate calls
  const lastFiltersRef = useRef<string>('');
  // Use ref to track if we have data (to avoid stale closure issues)
  const hasDataRef = useRef<boolean>(false);
  // Use ref to track debounce timeout to prevent rapid successive requests
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine dashboard layout type based on context preservation or user role
  // This preserves the dashboard context when navigating from employee/manager pages
  const dashboardType = useMemo(() => {
    // Wait for session to be loaded
    if (sessionStatus === 'loading' || !session?.user) {
      return 'employee'; // Default fallback while loading
    }

    // First, check URL search params for explicit context
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const contextParam = urlParams.get('context');
      if (contextParam === 'admin' || contextParam === 'manager' || contextParam === 'employee') {
        return contextParam;
      }

      // Check sessionStorage for the last dashboard context
      const storedContext = sessionStorage.getItem('dashboardContext');
      if (storedContext === 'admin' || storedContext === 'manager' || storedContext === 'employee') {
        return storedContext;
      }

      // Check document.referrer to determine where user came from
      const referrer = document.referrer;
      if (referrer) {
        if (referrer.includes('/dashboard/admin')) {
          return 'admin';
        } else if (referrer.includes('/dashboard/manager')) {
          return 'manager';
        } else if (referrer.includes('/dashboard/employee')) {
          return 'employee';
        }
      }
    }
    
    // Fall back to role-based determination for non-admin users
    const userRole = session.user.role;
    
    if (userRole === 'MANAGER') {
      return 'manager';
    } else if (userRole === 'EMPLOYEE') {
      return 'employee';
    } else {
      // For ADMIN, default to admin unless context suggests otherwise
      return 'admin';
    }
  }, [session?.user?.role, sessionStatus]);

  const fetchEmployees = async () => {
    try {
      let response;
      if (session?.user?.role === 'ADMIN') {
        // Admin can see all users
        response = await fetch('/api/admin/users?minimal=true&limit=1000&page=1&sortBy=name&sortOrder=asc');
      } else if (session?.user?.role === 'MANAGER') {
        // Manager can see assigned employees
        response = await fetch('/api/employees/assigned');
      } else {
        return;
      }

      if (!response.ok) return;

      const data = await response.json();
      const employeesList = Array.isArray(data) ? data : (data.employees || data.users || []);
      
      setEmployees(employeesList.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department || null
      })));

      // Extract unique departments
      const uniqueDepartments = Array.from(
        new Set(employeesList.map((emp: any) => emp.department).filter(Boolean))
      ) as string[];
      setDepartments(uniqueDepartments.sort());
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Initialize page - fetch employees and analytics in parallel for faster loading
  useEffect(() => {
    if (sessionStatus === 'loading') {
      return; // Wait for session to load
    }
    
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      router.push('/login');
      return;
    }
    
    // Fetch employees and analytics in parallel for faster loading
    const userRole = session.user.role;
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      fetchEmployees();
    }
    // Start fetching analytics immediately on initial load
    // Reset filter ref to allow fetch on initial load
    lastFiltersRef.current = ''; // Reset to allow fetch on initial load
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]); // Only depend on sessionStatus to prevent loops

  // Memoize fetchAnalytics to prevent re-creating on every render
  const fetchAnalytics = useCallback(async () => {
    // Only fetch if we have a valid session
    if (sessionStatus !== 'authenticated' || !session?.user) {
      return;
    }
    
    try {
      // Set loading only on initial load, use refreshing for subsequent updates
      if (!hasDataRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params = new URLSearchParams({
        startDate,
        endDate
      });

      // Add dashboard context to API call - this determines data scope for admins
      params.append('context', dashboardType);

      // Add role-based filters
      const userRole = session.user.role;
      if (userRole === 'ADMIN' || userRole === 'MANAGER') {
        if (selectedEmployee && selectedEmployee !== 'all') {
          params.append('employeeId', selectedEmployee);
        }
        if (selectedDepartment && selectedDepartment !== 'all') {
          params.append('department', selectedDepartment);
        }
      }

      const response = await fetch(`/api/analytics/dashboard?${params}`);
      if (!response.ok) {
        // Handle connection pool errors specifically
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Database connection limit reached. Please try again in a moment.');
        }
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      if (data.success) {
        // Ensure all required fields are present with defaults
        const sanitizedData: AnalyticsData = {
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
          trends: {
            monthly: data.trends?.monthly || {},
          },
          employeePerformance: data.employeePerformance || [],
        };
        setAnalyticsData(sanitizedData);
        hasDataRef.current = true; // Mark that we have data
        // Update filter ref after successful fetch to track current filter state
        const currentFilterKey = `${startDate}-${endDate}-${selectedEmployee}-${selectedDepartment}-${dashboardType}`;
        lastFiltersRef.current = currentFilterKey;
      } else {
        console.error('API returned error:', data.error);
        // Set empty data structure to prevent crashes
        setAnalyticsData({
          summary: {
            totalGoals: 0,
            completedGoals: 0,
            completionRate: 0,
            averageRating: 0,
            ratedGoals: 0,
            ratingCompletionRate: 0,
            overdueGoals: 0,
            totalUsers: 0,
          },
          breakdowns: {
            byStatus: {},
            byCategory: {},
            byPriority: {},
            byDepartment: {},
          },
          trends: {
            monthly: {},
          },
          employeePerformance: [],
        });
        hasDataRef.current = true; // Mark that we have attempted to load data
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      
      // Handle connection pool errors with user-friendly message
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('connection limit') || errorMessage.includes('too many clients')) {
        // Show user-friendly error message
        console.warn('Database connection limit reached. Retrying in 2 seconds...');
        // Retry after 2 seconds
        setTimeout(() => {
          if (sessionStatus === 'authenticated' && session?.user) {
            fetchAnalytics();
          }
        }, 2000);
        return; // Don't set empty data, wait for retry
      }
      
      // Set empty data structure on error to prevent crashes
      setAnalyticsData({
        summary: {
          totalGoals: 0,
          completedGoals: 0,
          completionRate: 0,
          averageRating: 0,
          ratedGoals: 0,
          ratingCompletionRate: 0,
          overdueGoals: 0,
          totalUsers: 0,
        },
        breakdowns: {
          byStatus: {},
          byCategory: {},
          byPriority: {},
          byDepartment: {},
        },
        trends: {
          monthly: {},
        },
        employeePerformance: [],
      });
      hasDataRef.current = true; // Mark that we have attempted to load data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionStatus, session?.user, startDate, endDate, selectedEmployee, selectedDepartment, dashboardType]);

  // Fetch analytics when filters change (only after session is loaded)
  useEffect(() => {
    if (sessionStatus === 'loading') {
      return; // Don't fetch until session is loaded
    }
    
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      return; // Don't fetch if no session
    }
    
    // Skip if we don't have data yet (initial load is handled separately)
    if (!hasDataRef.current) {
      return; // Wait for initial load to complete
    }
    
    // Check if filters actually changed before fetching
    const currentFilterKey = `${startDate}-${endDate}-${selectedEmployee}-${selectedDepartment}-${dashboardType}`;
    if (lastFiltersRef.current !== currentFilterKey) {
      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Debounce filter changes to prevent rapid successive requests (500ms delay)
      debounceTimeoutRef.current = setTimeout(() => {
        // Filters changed, reset ref to allow fetchAnalytics to proceed
        lastFiltersRef.current = '';
        fetchAnalytics();
      }, 500);
    }
    
    // Cleanup timeout on unmount or filter change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [startDate, endDate, selectedEmployee, selectedDepartment, dashboardType, fetchAnalytics, sessionStatus, session?.user]);

  // Handle refresh action
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics().finally(() => setRefreshing(false));
  }, [fetchAnalytics]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedEmployee('all');
    setSelectedDepartment('all');
  }, []);

  const handleExport = async (format: 'pdf'): Promise<void> => {
    if (!analyticsData) {
      alert('No data available to export');
      return;
    }

    try {
      const exportFilters: any = {
        startDate,
        endDate
      };
      
      // Include role-based filters in export
      if (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') {
        if (selectedEmployee && selectedEmployee !== 'all') {
          exportFilters.employeeId = selectedEmployee;
          const selectedEmp = employees.find(e => e.id === selectedEmployee);
          if (selectedEmp) {
            exportFilters.employeeName = selectedEmp.name;
          }
        }
        if (selectedDepartment && selectedDepartment !== 'all') {
          exportFilters.department = selectedDepartment;
        }
      }
      
      // Generate PDF client-side
      const { generatePDFReport } = await import('@/app/utils/pdfGenerator');
      const reportData = {
        ...analyticsData,
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: session?.user?.name || session?.user?.email || 'Unknown',
          role: session?.user?.role || 'UNKNOWN',
          filters: exportFilters
        }
      };
      
      const pdfDoc = generatePDFReport(reportData, 'Performance Analytics Report');
      const rolePrefix = session?.user?.role === 'ADMIN' ? 'admin' : session?.user?.role === 'MANAGER' ? 'manager' : 'employee';
      pdfDoc.save(`${rolePrefix}-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF report:', error);
      alert('Failed to export PDF report. Please try again.');
    }
  };

  if (!session || !session.user) {
    // Don't render anything if no session - will redirect
    return null;
  }
  // Prepare chart data with safety checks (even if analyticsData is null)
  const statusData = analyticsData?.breakdowns?.byStatus 
    ? Object.entries(analyticsData.breakdowns.byStatus)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const categoryData = analyticsData?.breakdowns?.byCategory
    ? Object.entries(analyticsData.breakdowns.byCategory)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const priorityData = analyticsData?.breakdowns?.byPriority
    ? Object.entries(analyticsData.breakdowns?.byPriority || {})
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const departmentData = analyticsData?.breakdowns?.byDepartment
    ? Object.entries(analyticsData.breakdowns.byDepartment)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const monthlyData = analyticsData?.trends?.monthly
    ? Object.entries(analyticsData.trends.monthly)
        .map(([month, count]) => {
          try {
            return {
              month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
              count: count || 0
            };
          } catch (e) {
            return { month: month, count: count || 0 };
          }
        })
        .sort((a, b) => {
          try {
            return new Date(a.month).getTime() - new Date(b.month).getTime();
          } catch (e) {
            return 0;
          }
        })
    : [];

  return (
    <DashboardLayout type={dashboardType}>
      <div className="max-w-7xl mx-auto space-y-5">
          {/* Toolbar + Filters */}
          <PageToolbar
            actions={[
              {
                label: 'Export PDF',
                onClick: () => handleExport('pdf'),
                variant: 'export',
              },
            ]}
            hasActiveFilters={selectedEmployee !== 'all' || selectedDepartment !== 'all'}
            onClearFilters={handleClearFilters}
          >
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
              <FilterSelect
                value={selectedEmployee === 'all' ? '' : selectedEmployee}
                onChange={(value) => setSelectedEmployee(value || 'all')}
                options={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                placeholder="All Employees"
              />
            )}
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && departments.length > 0 && (
              <FilterSelect
                value={selectedDepartment === 'all' ? '' : selectedDepartment}
                onChange={(value) => setSelectedDepartment(value || 'all')}
                options={departments.map(d => ({ value: d, label: d }))}
                placeholder="All Departments"
              />
            )}
          </PageToolbar>

          {/* No Data Message */}
          {!analyticsData && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-12 border border-theme shadow-xl text-center"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                  <BsBarChart className="w-16 h-16 text-tertiary" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">No Analytics Data Available</h3>
                <p className="text-secondary text-sm max-w-md">
                  There's no data to display for the selected filters. Try adjusting your date range or filters to see analytics.
                </p>
              </div>
            </motion.div>
          )}

          {/* Analytics Content */}
          {analyticsData && (
            <>

              {/* Stats Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-2"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-primary mb-1">Key Metrics</h2>
                  <p className="text-sm text-secondary">Overview of performance indicators</p>
                </div>
                {(() => {
                  const summary = analyticsData.summary;
                  const statItems: StatItem[] = [
                    {
                      title: 'Total Goals',
                      value: summary.totalGoals,
                      icon: <BsClipboardData className="w-4 h-4" />,
                      gradient: 'from-indigo-500 to-purple-500',
                      bgColor: 'bg-indigo-500/10',
                      borderColor: 'border-indigo-500/30'
                    },
                    {
                      title: 'Completed',
                      value: summary.completedGoals,
                      icon: <BsCheckCircle className="w-4 h-4" />,
                      gradient: 'from-emerald-500 to-teal-500',
                      bgColor: 'bg-emerald-500/10',
                      borderColor: 'border-emerald-500/30'
                    },
                    {
                      title: 'Completion Rate',
                      value: `${summary.completionRate.toFixed(1)}%`,
                      icon: <BsPercent className="w-4 h-4" />,
                      gradient: 'from-blue-500 to-cyan-500',
                      bgColor: 'bg-blue-500/10',
                      borderColor: 'border-blue-500/30'
                    },
                    {
                      title: 'Avg Rating',
                      value: summary.averageRating.toFixed(2),
                      icon: <BsStarIcon className="w-4 h-4" />,
                      gradient: 'from-amber-500 to-orange-500',
                      bgColor: 'bg-amber-500/10',
                      borderColor: 'border-amber-500/30'
                    }
                  ];
                  return <StatsSection stats={statItems} variant="auto" />;
                })()}
              </motion.div>

              {/* Status Breakdown Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-6"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-primary mb-1">Status Breakdown</h2>
                  <p className="text-sm text-secondary">Detailed breakdown of goals by status</p>
                </div>
                {(() => {
                  const byStatus = analyticsData.breakdowns.byStatus || {};
                  const statItems: StatItem[] = [
                    {
                      title: 'Draft',
                      value: byStatus['DRAFT'] || 0,
                      icon: <BsFileEarmarkText className="w-4 h-4" />,
                      gradient: 'from-gray-500 to-slate-500',
                      bgColor: 'bg-gray-500/10',
                      borderColor: 'border-gray-500/30'
                    },
                    {
                      title: 'Pending',
                      value: byStatus['PENDING'] || 0,
                      icon: <BsClock className="w-4 h-4" />,
                      gradient: 'from-amber-500 to-orange-500',
                      bgColor: 'bg-amber-500/10',
                      borderColor: 'border-amber-500/30'
                    },
                    {
                      title: 'Approved',
                      value: byStatus['APPROVED'] || 0,
                      icon: <BsCheck2Circle className="w-4 h-4" />,
                      gradient: 'from-emerald-500 to-teal-500',
                      bgColor: 'bg-emerald-500/10',
                      borderColor: 'border-emerald-500/30'
                    },
                    {
                      title: 'Rejected',
                      value: byStatus['REJECTED'] || 0,
                      icon: <BsXCircle className="w-4 h-4" />,
                      gradient: 'from-red-500 to-rose-500',
                      bgColor: 'bg-red-500/10',
                      borderColor: 'border-red-500/30'
                    },
                    {
                      title: 'Modified',
                      value: byStatus['MODIFIED'] || 0,
                      icon: <BsListCheck className="w-4 h-4" />,
                      gradient: 'from-blue-500 to-indigo-500',
                      bgColor: 'bg-blue-500/10',
                      borderColor: 'border-blue-500/30'
                    },
                    {
                      title: 'Completed',
                      value: byStatus['COMPLETED'] || 0,
                      icon: <BsCheckCircle className="w-4 h-4" />,
                      gradient: 'from-green-500 to-lime-500',
                      bgColor: 'bg-green-500/10',
                      borderColor: 'border-green-500/30'
                    }
                  ];
                  return <StatsSection stats={statItems} variant="auto" />;
                })()}
              </motion.div>

              {/* Charts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-2"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-primary mb-1">Visual Analytics</h2>
                  <p className="text-sm text-secondary">Charts and visualizations of your data</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals by Status */}
            <ChartCard title="Goals by Status" description="Distribution of goals across different statuses">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => {
                        if (!entry) return '';
                        const name = entry.name || '';
                        const percent = entry.percent ?? 0;
                        return name ? `${name}: ${(percent * 100).toFixed(0)}%` : '';
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-secondary">
                  No status data available
                </div>
              )}
            </ChartCard>

            {/* Goals by Category */}
            <ChartCard title="Goals by Category" description="Breakdown of goals by category">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-secondary">
                  No category data available
                </div>
              )}
            </ChartCard>

            {/* Monthly Trend */}
            <ChartCard title="Goals Created Over Time" description="Monthly trend of goal creation">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-secondary">
                  No trend data available
                </div>
              )}
            </ChartCard>

            {/* Goals by Priority */}
            <ChartCard title="Goals by Priority" description="Distribution by priority levels">
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-secondary">
                  No priority data available
                </div>
              )}
            </ChartCard>

            {/* Goals by Department - Show for Admin and Manager only */}
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
              <ChartCard title="Goals by Department" description="Department-wise goal distribution">
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-secondary">
                    No department data available
                  </div>
                )}
              </ChartCard>
              )}
                </div>
              </motion.div>

              {/* Employee Performance Table - Show for Admin, Manager, and Employee */}
              {analyticsData.employeePerformance.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2"
                >
              <ChartCard 
                title={
                  session?.user?.role === 'EMPLOYEE' 
                    ? 'My Performance' 
                    : session?.user?.role === 'MANAGER' 
                      ? 'Team Performance' 
                      : 'Top Performers'
                }
                description={
                  session?.user?.role === 'EMPLOYEE' 
                    ? 'Your performance metrics breakdown' 
                    : session?.user?.role === 'MANAGER' 
                      ? 'Performance overview of your team' 
                      : 'Top performing employees'
                }
              >
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-theme">
                        <th className="text-left py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Employee</th>
                        <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Total</th>
                        <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Completed</th>
                        <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Rate</th>
                        <th className="text-center py-3 px-3 text-sm font-semibold text-secondary uppercase tracking-wider">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {analyticsData.employeePerformance.map((emp, index) => {
                        const isHighPerformer = emp.completionRate >= 80 && emp.averageRating >= 4.0;
                        return (
                          <motion.tr
                            key={emp.employeeId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                            className={`border-b border-gray-800/30 hover:bg-gray-800/40 transition-all duration-200 ${isHighPerformer ? 'bg-green-500/5' : ''}`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isHighPerformer ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                <span className="text-white font-medium">{emp.employeeName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-gray-200 font-medium">{emp.totalGoals}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-green-400 font-medium">{emp.completedGoals}</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`font-semibold ${emp.completionRate >= 80 ? 'text-green-400' : emp.completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {emp.completionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-yellow-400 font-medium">{emp.averageRating.toFixed(1)}</span>
                                <BsStarFill className="w-3 h-3 text-yellow-400" />
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
              </motion.div>
              )}
            </>
          )}
      </div>
    </DashboardLayout>
  );
}


function ChartCard({ title, children, description }: { title: string; children: React.ReactNode; description?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-surface-elevated backdrop-blur-xl rounded-xl p-6 border border-theme shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="mb-5">
        <h3 className="text-xl font-bold text-primary mb-1 flex items-center gap-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-secondary">{description}</p>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

