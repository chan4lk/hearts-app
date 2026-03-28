'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { Users, Target, Heart, ClipboardCheck } from 'lucide-react';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import StatGrid from '@/app/components/shared/StatGrid';

interface TeamMember { id: string; name: string; email: string; department: string | null; position: string | null; role: string; }

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.ok ? r.json() : []),
      fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null),
    ]).then(([users, s]) => { setMembers(users.filter((u: any) => u.role === 'EMPLOYEE')); setStats(s); setLoading(false); });
  }, []);

  return (
    <DashboardLayout type="manager">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageTitle title="My Team" subtitle="Overview of your team's performance" icon={Users} iconColor="--color-accent" />

        {loading ? (
          <PageSkeleton type="table" count={3} />
        ) : (
          <>
            {stats && (
              <StatGrid stats={[
                { label: 'Team Size', value: stats.teamSize || members.length, icon: Users, color: '--color-accent' },
                { label: 'Active Goals', value: stats.teamActiveGoals || 0, icon: Target, color: '--color-goal-active' },
                { label: 'Hearts (30d)', value: stats.teamHeartsReceived || 0, icon: Heart, color: '--color-heart' },
                { label: 'Active Cycles', value: stats.activeCycles || 0, icon: ClipboardCheck, color: '--color-review' },
              ]} />
            )}

            <div className="card-section">
              <div className="px-5 py-3.5 border-b border-theme"><h3 className="text-sm font-semibold text-primary">Team Members ({members.length})</h3></div>
              <div className="divide-y divide-[rgb(var(--color-border-theme))]">
                {members.length === 0 ? (
                  <p className="text-center text-sm text-secondary py-12">No team members assigned yet</p>
                ) : members.map((m) => (
                  <div key={m.id} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-surface-secondary transition-colors">
                    <div className="avatar-md avatar-gradient">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">{m.name}</p>
                      <p className="text-xs text-tertiary">{m.position || m.department || m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}
