'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import EmptyState2 from '@/app/components/shared/EmptyState2';
import {
  BarChart3,
  Target,
  CheckCircle2,
  TrendingUp,
  Heart,
  Calendar,
  Users,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type Scope = 'self' | 'team' | 'all';

interface Summary {
  scope: Scope;
  userCount: number;
  totalGoals: number;
  byStatus: Record<string, number>;
  byCategory: { category: string; count: number }[];
  completedGoals: number;
  completionRate: number;
  avgProgress: number;
  heartsReceived: number;
  heartsGiven: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    targetDate: string;
    progress: number;
    owner: { id: string; name: string };
  }>;
  perUser: Array<{
    userId: string;
    name: string;
    department: string | null;
    position: string | null;
    goalsTotal: number;
    goalsActive: number;
    goalsCompleted: number;
    completionRate: number;
    heartsReceived: number;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'var(--color-goal-draft)',
  PENDING: 'var(--color-goal-pending)',
  ACTIVE: 'var(--color-goal-active)',
  NEEDS_REVISION: 'var(--color-goal-revision)',
  ON_HOLD: 'var(--color-goal-hold)',
  BLOCKED: 'var(--color-goal-blocked)',
  COMPLETED: 'var(--color-goal-completed)',
  CLOSED: 'var(--color-goal-closed)',
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', PENDING: 'Pending', ACTIVE: 'Active',
  NEEDS_REVISION: 'Revision', ON_HOLD: 'On Hold', BLOCKED: 'Blocked',
  COMPLETED: 'Completed', CLOSED: 'Closed',
};

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isManager = role === 'MANAGER' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';

  const [scope, setScope] = useState<Scope>('self');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/summary?scope=${scope}`);
    if (res.ok) setSummary(await res.json());
    setLoading(false);
  }, [scope]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const statusData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.byStatus)
      .map(([s, n]) => ({ name: STATUS_LABEL[s] || s, value: n, status: s }))
      .sort((a, b) => b.value - a.value);
  }, [summary]);

  return (
    <DashboardLayout type={isAdmin ? 'admin' : isManager ? 'manager' : 'employee'}>
      <div className="max-w-5xl mx-auto space-y-6">
        <PageTitle
          title="Reports & Achievements"
          subtitle="Goal progress, completion rate, and recognition metrics"
          icon={BarChart3}
          iconColor="--color-accent"
        />

        <div className="inline-flex gap-1 p-1 rounded-xl bg-surface-secondary w-fit">
          {(
            [
              { key: 'self', label: 'My Report' },
              ...(isManager ? ([{ key: 'team', label: 'Team Report' }] as const) : []),
              ...(isAdmin ? ([{ key: 'all', label: 'Company Report' }] as const) : []),
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setScope(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold focus-ring transition-all ${
                scope === t.key
                  ? 'bg-surface-elevated text-primary shadow-theme-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSkeleton type="cards" count={2} />
        ) : !summary || summary.totalGoals === 0 ? (
          <EmptyState2
            icon={BarChart3}
            title={
              scope === 'self'
                ? 'No goals to report yet'
                : scope === 'team'
                ? 'Your team has no goals yet'
                : 'No goals in the system yet'
            }
            description={
              scope === 'self'
                ? 'Create your first goal to start tracking achievements.'
                : scope === 'team'
                ? 'Once your reports create or are assigned goals, metrics appear here.'
                : 'As the company creates goals, full analytics appear here.'
            }
            color="--color-accent"
          />
        ) : (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                icon={Target}
                color="--color-goal-active"
                label="Total Goals"
                value={summary.totalGoals}
              />
              <KpiCard
                icon={CheckCircle2}
                color="--color-goal-completed"
                label="Completed"
                value={summary.completedGoals}
              />
              <KpiCard
                icon={TrendingUp}
                color="--color-accent"
                label="Completion Rate"
                value={`${summary.completionRate}%`}
              />
              <KpiCard
                icon={Heart}
                color="--color-heart"
                label="Hearts Received"
                value={summary.heartsReceived}
              />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SecondaryStat label="Avg. Progress (ACTIVE)" value={`${summary.avgProgress}%`} />
              <SecondaryStat label="Hearts Given" value={summary.heartsGiven} />
              {scope !== 'self' && (
                <SecondaryStat label="Users in Scope" value={summary.userCount} />
              )}
              <SecondaryStat label="Upcoming (14d)" value={summary.upcomingDeadlines.length} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status breakdown */}
              <div className="card-stat">
                <h3 className="text-sm font-semibold text-primary mb-3">Goals by status</h3>
                {statusData.length === 0 ? (
                  <p className="text-xs text-tertiary py-4 text-center">No data</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {statusData.map((entry) => (
                            <Cell
                              key={entry.status}
                              fill={`rgb(${STATUS_COLORS[entry.status]?.replace('var(', '').replace(')', '') ?? '--color-accent'})`}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category bar */}
              <div className="card-stat">
                <h3 className="text-sm font-semibold text-primary mb-3">Goals by category</h3>
                {summary.byCategory.length === 0 ? (
                  <p className="text-xs text-tertiary py-4 text-center">
                    No categorized goals yet
                  </p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.byCategory} layout="vertical" margin={{ left: 10 }}>
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{ fontSize: 11 }}
                          width={90}
                        />
                        <Tooltip />
                        <Bar dataKey="count" fill="rgb(var(--color-accent))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming deadlines */}
            {summary.upcomingDeadlines.length > 0 && (
              <div className="card-stat">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" /> Upcoming deadlines (next 14 days)
                </h3>
                <div className="space-y-2">
                  {summary.upcomingDeadlines.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-theme bg-surface-primary"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-primary truncate">{g.title}</p>
                        <p className="text-2xs text-tertiary">
                          {scope !== 'self' && `${g.owner.name} · `}
                          Due {new Date(g.targetDate).toLocaleDateString()} · {g.progress}%
                        </p>
                      </div>
                      <div className="w-24 h-1.5 bg-surface-secondary rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${g.progress}%`,
                            backgroundColor: 'rgb(var(--color-goal-active))',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-user table (team/all) */}
            {scope !== 'self' && summary.perUser.length > 0 && (
              <div className="card-stat">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-accent" /> Per-user achievement breakdown
                </h3>
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scrollbar-hide">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-surface-elevated">
                      <tr className="text-left text-2xs text-tertiary font-semibold uppercase tracking-wider">
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2 hidden sm:table-cell">Dept</th>
                        <th className="px-2 py-2 text-right">Goals</th>
                        <th className="px-2 py-2 text-right">Active</th>
                        <th className="px-2 py-2 text-right">Done</th>
                        <th className="px-2 py-2 text-right">Rate</th>
                        <th className="px-2 py-2 text-right">♥</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.perUser
                        .sort((a, b) => b.completionRate - a.completionRate)
                        .map((u) => (
                          <tr key={u.userId} className="border-t border-theme">
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                <div className="avatar-sm avatar-gradient text-2xs">
                                  {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-primary font-medium truncate">{u.name}</p>
                                  {u.position && (
                                    <p className="text-2xs text-tertiary truncate">{u.position}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 hidden sm:table-cell text-secondary">
                              {u.department || '—'}
                            </td>
                            <td className="px-2 py-2 text-right text-primary font-medium">
                              {u.goalsTotal}
                            </td>
                            <td className="px-2 py-2 text-right text-secondary">
                              {u.goalsActive}
                            </td>
                            <td className="px-2 py-2 text-right text-success font-medium">
                              {u.goalsCompleted}
                            </td>
                            <td className="px-2 py-2 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                  u.completionRate >= 70
                                    ? 'text-success'
                                    : u.completionRate >= 40
                                    ? 'text-warning'
                                    : 'text-tertiary'
                                }`}
                              >
                                {u.completionRate >= 70 && <Award className="w-3 h-3" />}
                                {u.completionRate}%
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right text-[rgb(var(--color-heart))] font-medium">
                              {u.heartsReceived}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}

function KpiCard({
  icon: Icon, color, label, value,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string; label: string; value: number | string;
}) {
  return (
    <div className="card-stat">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `rgba(var(${color}),0.1)` }}
        >
          <Icon className="w-5 h-5" style={{ color: `rgb(var(${color}))` }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-primary leading-tight">{value}</p>
          <p className="text-2xs text-tertiary">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SecondaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-stat text-center py-3">
      <p className="text-xl font-bold text-primary">{value}</p>
      <p className="text-2xs text-tertiary">{label}</p>
    </div>
  );
}
