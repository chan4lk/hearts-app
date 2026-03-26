'use client';

import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
import { PageHeader } from '@/app/components/shared/PageHeader';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import { Button } from '@/app/components/ui/button';
import dynamic from 'next/dynamic';
import PerformanceTable from './components/PerformanceTable';

const AnalyticsCharts = dynamic(() => import('./components/AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-64 rounded-xl border border-theme bg-surface-elevated animate-pulse" />
      ))}
    </div>
  ),
});
import { useAnalyticsData } from '@/app/hooks/useAnalyticsData';
import { BsBarChart, BsClipboardData, BsCheckCircle, BsPercent, BsStarFill, BsClock, BsFileEarmarkText, BsCheck2Circle, BsXCircle, BsListCheck, BsGraphUpArrow } from 'react-icons/bs';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';

export default function AnalyticsPage() {
  const {
    session,
    loading,
    error,
    handleRefresh,
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
    } catch (err) {
      alert('Failed to export PDF report. Please try again.');
    }
  };

  const showRoleFilters = userRole === 'ADMIN' || userRole === 'MANAGER';

  return (
    <DashboardLayout type={dashboardType}>
      {loading ? <LoadingSkeleton variant="page" /> :
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <PageHeader title="Performance Insights" description="Goals, completion rates, and team performance trends">
          <Button variant="outline" onClick={handleExport} className="focus-ring">
            📥 Export PDF
          </Button>
        </PageHeader>

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
          <ErrorState message={error} onRetry={handleRefresh} />
        )}

        {/* Empty state */}
        {!analyticsData && !loading && (
          <EmptyState
            icon={<BsBarChart className="w-8 h-8 text-tertiary" />}
            title="No Analytics Data Available"
            description="There is no data to display for the selected filters. Try adjusting your date range or filters."
          />
        )}

        {/* Analytics content */}
        {analyticsData && (
          <>
            {/* Key Metrics */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
              <MetricStrip metrics={[
                { label: 'Total Goals', value: analyticsData.summary.totalGoals, color: 'accent' },
                { label: 'Completed', value: analyticsData.summary.completedGoals, color: 'success' },
                { label: 'Completion Rate', value: `${analyticsData.summary.completionRate.toFixed(0)}%`, color: 'info' },
                { label: 'Avg Rating', value: analyticsData.summary.averageRating > 0 ? `⭐ ${analyticsData.summary.averageRating.toFixed(1)}` : '—', color: 'warning' },
              ]} />
            </motion.div>

            {/* Status Breakdown (collapsible) */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
              <MetricStrip metrics={Object.entries(analyticsData.breakdowns.byStatus || {}).filter(([, v]) => v > 0).map(([status, count]) => ({
                label: status.replace(/_/g, ' '),
                value: count,
                color: status === 'COMPLETED' ? 'success' as const : status === 'PENDING' ? 'warning' as const : status === 'APPROVED' ? 'info' as const : status === 'REJECTED' ? 'error' as const : 'secondary' as const,
              }))} />
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
      </div>}
    </DashboardLayout>
  );
}

