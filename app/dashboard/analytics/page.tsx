'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
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
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Download, Calendar, TrendingUp, Target, Users, Award, RefreshCw, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { PageContainer } from '@/app/components/shared/PageContainer';
import { FilterBadge } from '@/app/components/shared/FilterBadge';

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
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();
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
  
  // Use ref to track if we've initialized to prevent duplicate calls
  const initializedRef = useRef(false);
  const lastFiltersRef = useRef<string>('');

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

  // Initialize page - only run once when session is loaded
  useEffect(() => {
    if (sessionStatus === 'loading') {
      return; // Wait for session to load
    }
    
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      router.push('/login');
      return;
    }
    
    // Fetch employees and departments based on role (only once when session is ready)
    const userRole = session.user.role;
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]); // Only depend on sessionStatus to prevent loops

  // Memoize fetchAnalytics to prevent re-creating on every render
  const fetchAnalytics = useCallback(async () => {
    // Only fetch if we have a valid session
    if (sessionStatus !== 'authenticated' || !session?.user) {
      return;
    }
    
    // Create a filter key to check if filters actually changed
    const filterKey = `${startDate}-${endDate}-${selectedEmployee}-${selectedDepartment}`;
    if (lastFiltersRef.current === filterKey && analyticsData) {
      return; // Don't refetch if filters haven't changed and we already have data
    }
    lastFiltersRef.current = filterKey;
    
    try {
      setRefreshing(true);
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
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionStatus, session?.user, startDate, endDate, selectedEmployee, selectedDepartment, dashboardType, analyticsData]);

  // Fetch analytics when filters change (only after session is loaded)
  useEffect(() => {
    if (sessionStatus === 'loading') {
      return; // Don't fetch until session is loaded
    }
    
    if (sessionStatus === 'unauthenticated' || !session?.user) {
      return; // Don't fetch if no session
    }
    
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, startDate, endDate, selectedEmployee, selectedDepartment, dashboardType, fetchAnalytics]);

  const handleExport = async (format: 'pdf' | 'json') => {
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
      
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportType: 'dashboard',
          analyticsData,
          options: {
            filters: exportFilters,
            role: session?.user?.role
          }
        })
      });

      const data = await response.json();
      
      if (format === 'json') {
        const reportData = {
          ...data.report,
          metadata: {
            exportedAt: new Date().toISOString(),
            exportedBy: session?.user?.name || session?.user?.email,
            role: session?.user?.role,
            filters: exportFilters
          }
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const rolePrefix = session?.user?.role === 'ADMIN' ? 'admin' : session?.user?.role === 'MANAGER' ? 'manager' : 'employee';
        a.href = url;
        a.download = `${rolePrefix}-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // PDF export would require client-side PDF generation
        alert('PDF export requires jspdf library. JSON export is available.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  // Wait for session to load before rendering
  if (sessionStatus === 'loading') {
    return <LoadingComponent />;
  }

  if (!session || !session.user) {
    // Don't render anything if no session - will redirect
    return null;
  }

  // Show loading only if we're actually loading data, not just waiting for session
  if (loading && !analyticsData) {
    return <LoadingComponent />;
  }

  if (!analyticsData) {
    return (
      <DashboardLayout type={dashboardType}>
        <div className="p-8 text-center">
          <p className="text-gray-400">No analytics data available</p>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare chart data with safety checks
  const statusData = analyticsData.breakdowns?.byStatus 
    ? Object.entries(analyticsData.breakdowns.byStatus)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const categoryData = analyticsData.breakdowns?.byCategory
    ? Object.entries(analyticsData.breakdowns.byCategory)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const priorityData = analyticsData.breakdowns?.byPriority
    ? Object.entries(analyticsData.breakdowns.byPriority)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const departmentData = analyticsData.breakdowns?.byDepartment
    ? Object.entries(analyticsData.breakdowns.byDepartment)
        .filter(([_, value]) => value && value > 0)
        .map(([name, value]) => ({
          name,
          value
        }))
    : [];

  const monthlyData = analyticsData.trends?.monthly
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
      <PageContainer>
        {/* Header */}
        <PageHeader
          title={
            session?.user?.role === 'ADMIN' 
              ? 'Analytics Dashboard' 
              : session?.user?.role === 'MANAGER' 
                ? 'Team Analytics Dashboard' 
                : 'My Performance Analytics'
          }
          description={
            session?.user?.role === 'ADMIN' 
              ? 'Organization-wide performance metrics and insights' 
              : session?.user?.role === 'MANAGER' 
                ? 'Performance metrics for your team members' 
                : 'Your personal performance metrics and insights'
          }
        >
          {/* Date Range Filter */}
          <FilterBadge icon={<Calendar className="h-4 w-4" />}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-sm border-none outline-none w-32"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-sm border-none outline-none w-32"
            />
          </FilterBadge>

          {/* Employee Filter (Admin & Manager only) */}
          {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && employees.length > 0 && (
            <FilterBadge icon={<Filter className="h-4 w-4" />}>
              <Select
                value={selectedEmployee}
                onValueChange={(value) => {
                  setSelectedEmployee(value);
                  setLoading(true);
                }}
              >
                <SelectTrigger className="w-[200px] h-8 bg-transparent border-none text-white text-sm focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterBadge>
          )}

          {/* Department Filter (Admin & Manager only) */}
          {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && departments.length > 0 && (
            <FilterBadge icon={<Filter className="h-4 w-4" />}>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => {
                  setSelectedDepartment(value);
                  setLoading(true);
                }}
              >
                <SelectTrigger className="w-[180px] h-8 bg-transparent border-none text-white text-sm focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterBadge>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Loading...' : 'Refresh'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg flex items-center gap-2 transition-all shadow-md"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </motion.button>
        </PageHeader>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <SummaryCard
              title="Total Goals"
              value={analyticsData.summary.totalGoals}
              icon={<Target className="h-5 w-5" />}
              color="blue"
            />
            <SummaryCard
              title="Completion Rate"
              value={`${analyticsData.summary.completionRate.toFixed(1)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              color="green"
            />
            <SummaryCard
              title="Average Rating"
              value={analyticsData.summary.averageRating.toFixed(1)}
              icon={<Award className="h-5 w-5" />}
              color="yellow"
            />
            <SummaryCard
              title={session?.user?.role === 'EMPLOYEE' ? 'My Goals' : session?.user?.role === 'MANAGER' ? 'Team Members' : 'Active Users'}
              value={session?.user?.role === 'EMPLOYEE' ? analyticsData.summary.totalGoals : analyticsData.summary.totalUsers}
              icon={<Users className="h-5 w-5" />}
              color="purple"
            />
          </motion.div>


          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Goals by Status */}
            <ChartCard title="Goals by Status">
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
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  No status data available
                </div>
              )}
            </ChartCard>

            {/* Goals by Category */}
            <ChartCard title="Goals by Category">
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
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  No category data available
                </div>
              )}
            </ChartCard>

            {/* Monthly Trend */}
            <ChartCard title="Goals Created Over Time">
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
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  No trend data available
                </div>
              )}
            </ChartCard>

            {/* Goals by Priority */}
            <ChartCard title="Goals by Priority">
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
                <div className="flex items-center justify-center h-[300px] text-gray-400">
                  No priority data available
                </div>
              )}
            </ChartCard>

            {/* Goals by Department - Show for Admin and Manager only */}
            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
              <ChartCard title="Goals by Department">
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
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    No department data available
                  </div>
                )}
              </ChartCard>
            )}
          </motion.div>

          {/* Employee Performance Table - Show for Admin, Manager, and Employee */}
          {analyticsData.employeePerformance.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ChartCard title={
                session?.user?.role === 'EMPLOYEE' 
                  ? 'My Performance' 
                  : session?.user?.role === 'MANAGER' 
                    ? 'Team Performance' 
                    : 'Top Performers'
              }>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3 text-gray-400 font-medium">Employee</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Total Goals</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Completed</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Completion Rate</th>
                        <th className="text-left p-3 text-gray-400 font-medium">Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.employeePerformance.map((emp, index) => (
                        <motion.tr
                          key={emp.employeeId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="p-3 text-white font-medium">{emp.employeeName}</td>
                          <td className="p-3 text-gray-300">{emp.totalGoals}</td>
                          <td className="p-3 text-gray-300">{emp.completedGoals}</td>
                          <td className="p-3 text-gray-300">{emp.completionRate.toFixed(1)}%</td>
                          <td className="p-3 text-gray-300">{emp.averageRating.toFixed(1)}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </motion.div>
          )}
      </PageContainer>
    </DashboardLayout>
  );
}

function SummaryCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 text-blue-400',
    green: 'bg-gradient-to-br from-green-600/20 to-green-700/20 text-green-400',
    yellow: 'bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 text-yellow-400',
    purple: 'bg-gradient-to-br from-purple-600/20 to-purple-700/20 text-purple-400'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
          <div className={colorClasses[color] + ' p-2 rounded-lg'}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

