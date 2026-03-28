'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import Link from 'next/link';
import { Users, Heart, Calendar, Shield, Target, ClipboardCheck, TrendingUp } from 'lucide-react';

interface DashStats { totalUsers?: number; heartsThisMonth?: number; activeGoals?: number; activeCycles?: number; goalCompletionRate?: number; totalGoals?: number; completedGoals?: number; [key: string]: any; }

const adminLinks = [
  { href: '/dashboard/admin/users', label: 'User Management', description: 'Manage roles, managers, and accounts', icon: Users, color: '--color-accent' },
  { href: '/dashboard/admin/values', label: 'Company Values', description: 'Configure Heart value tags', icon: Heart, color: '--color-heart' },
  { href: '/dashboard/admin/cycles', label: 'Review Cycles', description: 'Create performance review cycles', icon: Calendar, color: '--color-review' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => { fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null).then(setStats); }, []);

  return (
    <DashboardLayout type="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" /> Admin Dashboard
          </h1>
          <p className="text-sm text-secondary mt-0.5">System management and analytics</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: '--color-accent' },
              { label: 'Hearts (30d)', value: stats.heartsThisMonth || 0, icon: Heart, color: '--color-heart' },
              { label: 'Active Goals', value: stats.activeGoals || 0, icon: Target, color: '--color-goal-active' },
              { label: 'Goal Completion', value: `${stats.goalCompletionRate || 0}%`, icon: TrendingUp, color: '--color-goal-completed' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `rgba(var(${color}),0.1)` }}>
                    <Icon className="w-5 h-5" style={{ color: `rgb(var(${color}))` }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-primary">{value}</p>
                    <p className="text-2xs text-tertiary">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {adminLinks.map(({ href, label, description, icon: Icon, color }) => (
            <Link key={href} href={href}
              className="bg-surface-elevated rounded-2xl border border-theme p-6 shadow-theme-sm hover:shadow-theme-md transition-all focus-ring group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: `rgba(var(${color}),0.1)` }}>
                <Icon className="w-6 h-6" style={{ color: `rgb(var(${color}))` }} />
              </div>
              <h3 className="text-sm font-semibold text-primary mb-1 group-hover:text-accent transition-colors">{label}</h3>
              <p className="text-xs text-secondary">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
