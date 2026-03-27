'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';

export default function ManagerDashboard() {
  return (
    <DashboardLayout type="manager">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="Team Hub" description="Manage your team's performance" badge="Manager" />
      </div>
    </DashboardLayout>
  );
}
