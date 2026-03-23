'use client';

import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import AnalyticsCharts from './components/AnalyticsCharts';
import PerformanceTable from './components/PerformanceTable';
import { useAnalyticsData } from '@/app/hooks/useAnalyticsData';
import { BsBarChart, BsClipboardData, BsCheckCircle, BsPercent, BsStarFill, BsClock, BsFileEarmarkText, BsCheck2Circle, BsXCircle, BsListCheck } from 'react-icons/bs';

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
      <div className="max-w-7xl mx-auto space-y-5">
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
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Empty state */}
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
                There's no data to display for the selected filters. Try adjusting your date range or filters.
              </p>
            </div>
          </motion.div>
        )}

        {/* Analytics content */}
        {analyticsData && (
          <>
            {/* Key Metrics */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-2">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-primary mb-1">Key Metrics</h2>
                <p className="text-sm text-secondary">Overview of performance indicators</p>
              </div>
              <StatsSection stats={keyMetrics(analyticsData.summary)} variant="auto" />
            </motion.div>

            {/* Status Breakdown */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-primary mb-1">Status Breakdown</h2>
                <p className="text-sm text-secondary">Detailed breakdown of goals by status</p>
              </div>
              <StatsSection stats={statusBreakdownStats(analyticsData.breakdowns.byStatus)} variant="auto" />
            </motion.div>

            {/* Charts */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-2">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-primary mb-1">Visual Analytics</h2>
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
      gradient: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30'
    },
    {
      title: 'Completed', value: summary.completedGoals,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Completion Rate', value: `${summary.completionRate.toFixed(1)}%`,
      icon: <BsPercent className="w-4 h-4" />,
      gradient: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30'
    },
    {
      title: 'Avg Rating', value: summary.averageRating.toFixed(2),
      icon: <BsStarFill className="w-4 h-4" />,
      gradient: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30'
    }
  ];
}

function statusBreakdownStats(byStatus: Record<string, number>): StatItem[] {
  return [
    {
      title: 'Draft', value: byStatus['DRAFT'] || 0,
      icon: <BsFileEarmarkText className="w-4 h-4" />,
      gradient: 'from-gray-500 to-slate-500', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30'
    },
    {
      title: 'Pending', value: byStatus['PENDING'] || 0,
      icon: <BsClock className="w-4 h-4" />,
      gradient: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30'
    },
    {
      title: 'Approved', value: byStatus['APPROVED'] || 0,
      icon: <BsCheck2Circle className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30'
    },
    {
      title: 'Rejected', value: byStatus['REJECTED'] || 0,
      icon: <BsXCircle className="w-4 h-4" />,
      gradient: 'from-red-500 to-rose-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30'
    },
    {
      title: 'Modified', value: byStatus['MODIFIED'] || 0,
      icon: <BsListCheck className="w-4 h-4" />,
      gradient: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30'
    },
    {
      title: 'Completed', value: byStatus['COMPLETED'] || 0,
      icon: <BsCheckCircle className="w-4 h-4" />,
      gradient: 'from-green-500 to-lime-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30'
    }
  ];
}
