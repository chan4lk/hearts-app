'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@prisma/client';

export default function DashboardRedirect() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (status === 'loading') {
        console.log('[Dashboard] Status: Loading');
        return;
      }

      // Force a session refresh
      console.log('[Dashboard] Forcing session refresh...');
      await update();
      
      if (!session?.user) {
        console.log('[Dashboard] No session, redirecting to login');
        router.replace('/login');
        return;
      }

      const userRole = session.user.role as Role;
      console.log('[Dashboard] User details:', {
        email: session.user.email,
        role: userRole,
        sessionId: session.user.id
      });

      let targetDashboard = '/dashboard/employee';
      
      if (userRole === 'ADMIN') {
        console.log('[Dashboard] Role is ADMIN');
        targetDashboard = '/dashboard/admin';
      } else if (userRole === 'MANAGER') {
        console.log('[Dashboard] Role is MANAGER');
        targetDashboard = '/dashboard/manager';
      } else {
        console.log('[Dashboard] Role is EMPLOYEE');
        targetDashboard = '/dashboard/employee';
      }

      console.log(`[Dashboard] Redirecting to: ${targetDashboard}`);
      router.replace(targetDashboard);
    };

    checkAndRedirect();
  }, [session, status, router, update]);

  return null;
} 