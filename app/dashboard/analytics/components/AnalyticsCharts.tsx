'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import ChartCard from './ChartCard';
import type { AnalyticsData } from '@/app/hooks/useAnalyticsData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TOOLTIP_STYLE = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px'
};

interface AnalyticsChartsProps {
  data: AnalyticsData;
  showDepartment: boolean;
}

function toChartArray(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[300px] text-secondary">
      {message}
    </div>
  );
}

export default function AnalyticsCharts({ data, showDepartment }: AnalyticsChartsProps) {
  const statusData = useMemo(() => toChartArray(data.breakdowns.byStatus), [data.breakdowns.byStatus]);
  const categoryData = useMemo(() => toChartArray(data.breakdowns.byCategory), [data.breakdowns.byCategory]);
  const priorityData = useMemo(() => toChartArray(data.breakdowns.byPriority), [data.breakdowns.byPriority]);
  const departmentData = useMemo(() => toChartArray(data.breakdowns.byDepartment), [data.breakdowns.byDepartment]);

  const monthlyData = useMemo(() => {
    return Object.entries(data.trends.monthly)
      .map(([month, count]) => {
        try {
          return {
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            sortKey: month,
            count: count || 0
          };
        } catch {
          return { month, sortKey: month, count: count || 0 };
        }
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [data.trends.monthly]);

  return (
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
                {statusData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No status data available" />
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
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No category data available" />
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
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No trend data available" />
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
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No priority data available" />
        )}
      </ChartCard>

      {/* Goals by Department */}
      {showDepartment && (
        <ChartCard title="Goals by Department" description="Department-wise goal distribution">
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No department data available" />
          )}
        </ChartCard>
      )}
    </div>
  );
}
