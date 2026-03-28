'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { Users, Target, Heart, ClipboardCheck } from 'lucide-react';

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
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Users className="w-6 h-6 text-accent" /> My Team</h1>
          <p className="text-sm text-secondary mt-0.5">Overview of your team's performance</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-surface-elevated rounded-2xl border border-theme animate-pulse" />)}</div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Team Size', value: stats.teamSize || members.length, icon: Users, color: '--color-accent' },
                  { label: 'Active Goals', value: stats.teamActiveGoals || 0, icon: Target, color: '--color-goal-active' },
                  { label: 'Hearts (30d)', value: stats.teamHeartsReceived || 0, icon: Heart, color: '--color-heart' },
                  { label: 'Active Cycles', value: stats.activeCycles || 0, icon: ClipboardCheck, color: '--color-review' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(var(${color}),0.1)` }}>
                        <Icon className="w-5 h-5" style={{ color: `rgb(var(${color}))` }} />
                      </div>
                      <div><p className="text-xl font-bold text-primary">{value}</p><p className="text-2xs text-tertiary">{label}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-surface-elevated rounded-2xl border border-theme shadow-theme-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-theme"><h3 className="text-sm font-semibold text-primary">Team Members ({members.length})</h3></div>
              <div className="divide-y divide-[rgb(var(--color-border-theme))]">
                {members.length === 0 ? (
                  <p className="text-center text-sm text-secondary py-12">No team members assigned yet</p>
                ) : members.map((m) => (
                  <div key={m.id} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-surface-secondary transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[rgb(var(--color-accent))] to-[rgb(var(--color-review))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
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
