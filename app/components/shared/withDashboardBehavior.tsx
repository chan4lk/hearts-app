'use client';

import { useRole } from '../context/RoleContext';
import { DashboardBehavior, hasAccess } from '@/lib/dashboard-utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface DashboardBehaviorProps {
  requiredBehavior: DashboardBehavior;
}

export function withDashboardBehavior<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredBehavior: DashboardBehavior
) {
  return function WithDashboardBehaviorWrapper(props: P) {
    const { activeRole } = useRole();
    const router = useRouter();

    useEffect(() => {
      // Check if the current role has access to this behavior
      if (!hasAccess(activeRole, requiredBehavior)) {
        // Redirect to the appropriate dashboard based on the highest available behavior
        router.push('/dashboard/employee');
      }
    }, [activeRole, router]);

    // Only render the component if the role has access to this behavior
    if (!hasAccess(activeRole, requiredBehavior)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Helper hook for components that need to check behavior access
export function useDashboardBehavior(requiredBehavior: DashboardBehavior): boolean {
  const { activeRole } = useRole();
  return hasAccess(activeRole, requiredBehavior);
} 