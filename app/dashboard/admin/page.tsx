'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';

export default function AdminDashboard() {
  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="Admin Dashboard" description="System overview and management" badge="Admin" />
      </div>
    </DashboardLayout>
  );
}
