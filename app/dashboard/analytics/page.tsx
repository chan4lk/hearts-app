'use client';

import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import AnalyticsCharts from './components/AnalyticsCharts';
import PerformanceTable from './components/PerformanceTable';
import { useAnalyticsData } from '@/app/hooks/useAnalyticsData';
import { BsBarChart, BsClipboardData, BsCheckCircle, BsPercent, BsStarFill, BsClock, BsFileEarmarkText, BsCheck2Circle, BsXCircle, BsListCheck, BsGraphUpArrow } from 'react-icons/bs';

export default function AnalyticsPage() {
  const {
    session,
    loading,
    error,
    analyticsData,
    dashboardType,
    selectedEmployee, setSelectedEmployee,
    selectedDepartment, setSelectedDepartment,
    employees,
    departments,
    handleClearFilters,
  } = useAnalyticsData();

  if (!session?.user) return null;

  const userRole = session.user.role;

  const handleExport = async () => {
    if (!analyticsData) {
      alert('No data available to export');
      return;
    }
    try {
      const { generatePDFReport } = await import('@/app/utils/pdfGenerator');
      const exportFilters: Record<string, string> = {};
      if (selectedEmployee !== 'all') {
        const emp = employees.find(e => e.id === selectedEmployee);
        if (emp) exportFilters.employeeName = emp.name;
      }
      if (selectedDepartment !== 'all') exportFilters.department = selectedDepartment;

      const reportData = {
        ...analyticsData,
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: session.user.name || session.user.email || 'Unknown',
          role: userRole,
          filters: exportFilters
        }
      };
      const pdfDoc = generatePDFReport(reportData, 'Performance Analytics Report');
      const prefix = userRole === 'ADMIN' ? 'admin' : userRole === 'MANAGER' ? 'manager' : 'employee';
      pdfDoc.save(`${prefix}-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) { // handled silently
      alert('Failed to export PDF report. Please try again.');
    }
  };

  const showRoleFilters = userRole === 'ADMIN' || userRole === 'MANAGER';

  return (
    <DashboardLayout type={dashboardType}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header — editorial hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-surface-elevated border border-theme shadow-theme-md p-8 md:p-10"
        >
          {/* Top accent gradient line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-info))] to-[rgb(var(--color-success))]" />
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-5">
            <div className="flex-shrink-0 p-4 rounded-2xl bg-accent-muted">
              <BsGraphUpArrow className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
                <span className="bg-gradient-to-r from-[rgb(var(--color-accent))] to-[rgb(var(--color-info))] bg-clip-text text-transparent">
                  Performance Analytics
                </span>
              </h1>
              <p className="mt-1 text-sm md:text-base text-secondary max-w-xl">
                Comprehensive insights into goals, completion rates, and team performance trends.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Toolbar */}
        <PageToolbar
          actions={[{ label: 'Export PDF', onClick: handleExport, variant: 'export' }]}
          hasActiveFilters={selectedEmployee !== 'all' || selectedDepartment !== 'all'}
          onClearFilters={handleClearFilters}
        >
          {showRoleFilters && (
            <FilterSelect
              value={selectedEmployee === 'all' ? '' : selectedEmployee}
              onChange={(v) => setSelectedEmployee(v || 'all')}
              options={employees.map(e => ({ value: e.id, label: e.name }))}
              placeholder="All Employees"
            />
          )}
          {showRoleFilters && departments.length > 0 && (
            <FilterSelect
              value={selectedDepartment === 'all' ? '' : selectedDepartment}
              onChange={(v) => setSelectedDepartment(v || 'all')}
              options={departments.map(d => ({ value: d, label: d }))}
              placeholder="All Departments"
            />
          )}
        </PageToolbar>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-error-muted border border-[rgb(var(--color-error))]/30 rounded-2xl p-4 text-error text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Empty state */}
        {!analyticsData && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-surface-elevated rounded-2xl p-16 border border-theme shadow-theme-md text-center transition-all duration-300"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-info))] to-[rgb(var(--color-success))]" />
            <div className="flex flex-col items-center justify-center">
              <div className="p-5 bg-accent-muted rounded-2xl mb-5">
                <BsBarChart className="w-16 h-16 text-accent opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">No Analytics Data Available</h3>
              <p className="text-secondary text-sm max-w-md leading-relaxed">
                There is no data to display for the selected filters. Try adjusting your date range or filters.
              </p>
            </div>
          </motion.div>
        )}

        {/* Analytics content */}
        {analyticsData && (
          <>
            {/* Key Metrics */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-primary mb-1 tracking-tight">Key Metrics</h2>
                <p className="text-sm text-secondary">Overview of performance indicators</p>
              </div>
              <StatsSection stats={keyMetrics(analyticsData.summary)} />
            </motion.div>

            {/* Status Breakdown */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-primary mb-1 tracking-tight">Status Breakdown</h2>
                <p className="text-sm text-secondary">Detailed breakdown of goals by status</p>
              </div>
              <StatsSection stats={statusBreakdownStats(analyticsData.breakdowns.byStatus)} />
            </motion.div>

            {/* Charts — hero section */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-primary mb-1 tracking-tight">Visual Analytics</h2>
                <p className="text-sm text-secondary">Charts and visualizations of your data</p>
              </div>
              <AnalyticsCharts data={analyticsData} showDepartment={showRoleFilters} />
            </motion.div>

            {/* Performance Table */}
            <PerformanceTable data={analyticsData.employeePerformance} userRole={userRole} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── Stat builders (pure functions, no hooks needed) ──

function keyMetrics(summary: { totalGoals: number; completedGoals: number; completionRate: number; averageRating: number }): StatItem[] {
  return [
    {
      title: 'Total Goals', value: summary.totalGoals,
      icon: <BsClipboardData className="w-4 h-4" />,
    },
    {
      title: 'Completed', value: summary.completedGoals,
      icon: <BsCheckCircle className="w-4 h-4" />,
    },
    {
      title: 'Completion Rate', value: `${summary.completionRate.toFixed(1)}%`,
      icon: <BsPercent className="w-4 h-4" />,
    },
    {
      title: 'Avg Rating', value: summary.averageRating.toFixed(2),
      icon: <BsStarFill className="w-4 h-4" />,
    }
  ];
}

function statusBreakdownStats(byStatus: Record<string, number>): StatItem[] {
  return [
    {
      title: 'Draft', value: byStatus['DRAFT'] || 0,
      icon: <BsFileEarmarkText className="w-4 h-4" />,
    },
    {
      title: 'Pending', value: byStatus['PENDING'] || 0,
      icon: <BsClock className="w-4 h-4" />,
    },
    {
      title: 'Approved', value: byStatus['APPROVED'] || 0,
      icon: <BsCheck2Circle className="w-4 h-4" />,
    },
    {
      title: 'Rejected', value: byStatus['REJECTED'] || 0,
      icon: <BsXCircle className="w-4 h-4" />,
    },
    {
      title: 'Modified', value: byStatus['MODIFIED'] || 0,
      icon: <BsListCheck className="w-4 h-4" />,
    },
    {
      title: 'Completed', value: byStatus['COMPLETED'] || 0,
      icon: <BsCheckCircle className="w-4 h-4" />,
    }
  ];
}
