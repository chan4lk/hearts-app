'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@prisma/client';
import { getDefaultRedirectPath } from '@/app/utils/roleAccess';

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

      const targetDashboard = getDefaultRedirectPath(userRole);
      console.log(`[Dashboard] Redirecting to: ${targetDashboard}`);
      router.replace(targetDashboard);
    };

    checkAndRedirect();
  }, [session, status, router, update]);

  return null;
} 