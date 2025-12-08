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
        return;
      }

      // Force a session refresh
      await update();
      
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const userRole = session.user.role as Role;
      const targetDashboard = getDefaultRedirectPath(userRole);
      router.replace(targetDashboard);
    };

    checkAndRedirect();
  }, [session, status, router, update]);

  return null;
} 