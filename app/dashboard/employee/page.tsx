'use client';

import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { useSession } from 'next-auth/react';

export default function EmployeeDashboard() {
  const { data: session } = useSession();

  return (
    <DashboardLayout type="employee">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title={`Welcome, ${session?.user?.name || 'Employee'}`} description="Your performance dashboard" />
      </div>
    </DashboardLayout>
  );
}
