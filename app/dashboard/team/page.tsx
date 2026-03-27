'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import HeartButton from '@/app/components/hearts/HeartButton';
import { Users, Target, Heart, ClipboardCheck } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.ok ? r.json() : []),
      fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null),
    ]).then(([users, dashStats]) => {
      setMembers(users.filter((u: any) => u.role === 'EMPLOYEE'));
      setStats(dashStats);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout type="manager">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="My Team" description="Overview of your team's performance" badge="Manager" />

        {loading ? (
          <div className="text-center py-12 text-secondary">Loading team data...</div>
        ) : (
          <>
            {/* Team Stats */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Team Size', value: stats.teamSize || members.length, icon: Users },
                  { label: 'Active Goals', value: stats.teamActiveGoals || 0, icon: Target },
                  { label: 'Hearts (30d)', value: stats.teamHeartsReceived || 0, icon: Heart },
                  { label: 'Active Cycles', value: stats.activeCycles || 0, icon: ClipboardCheck },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-surface-elevated rounded-lg border border-theme p-4 shadow-theme-sm">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-secondary" />
                      <div>
                        <p className="text-2xl font-bold text-primary">{value}</p>
                        <p className="text-xs text-secondary">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team Members */}
            <div className="bg-surface-elevated rounded-lg border border-theme shadow-theme-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-theme">
                <h3 className="text-sm font-semibold text-primary">Team Members</h3>
              </div>
              <div className="divide-y divide-[rgb(var(--color-border-theme))]">
                {members.length === 0 ? (
                  <p className="text-center text-sm text-secondary py-8">No team members assigned yet</p>
                ) : (
                  members.map((member) => (
                    <div key={member.id} className="px-4 py-3 flex items-center gap-3 hover:bg-surface-secondary transition-colors">
                      <div className="w-9 h-9 rounded-full bg-accent-muted flex items-center justify-center text-xs font-bold text-accent">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary">{member.name}</p>
                        <p className="text-xs text-tertiary">{member.position || member.department || member.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}
