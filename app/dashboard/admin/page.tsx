'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import Link from 'next/link';
import { Users, Heart, Calendar, Shield } from 'lucide-react';

const adminLinks = [
  { href: '/dashboard/admin/users', label: 'User Management', description: 'Manage roles, managers, and account status', icon: Users },
  { href: '/dashboard/admin/values', label: 'Company Values', description: 'Configure Heart value tags', icon: Heart },
  { href: '/dashboard/admin/cycles', label: 'Review Cycles', description: 'Create and manage performance review cycles', icon: Calendar },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout type="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Admin Dashboard" description="System management and configuration" badge="Admin" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {adminLinks.map(({ href, label, description, icon: Icon }) => (
            <Link key={href} href={href}
              className="bg-surface-elevated rounded-xl border border-theme p-5 shadow-theme-sm hover:shadow-theme-md transition-shadow focus-ring group">
              <Icon className="w-8 h-8 text-accent mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-semibold text-primary mb-1">{label}</h3>
              <p className="text-xs text-secondary">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
