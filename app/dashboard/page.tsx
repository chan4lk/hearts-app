'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@prisma/client';

export default function DashboardRedirect() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') {
      console.log('[Dashboard] Status: Loading');
      return;
    }

    const updateSession = async () => {
      console.log('[Dashboard] Updating session...');
      await update();
    };
    updateSession();

    if (!session?.user) {
      console.log('[Dashboard] No session, redirecting to login');
      router.replace('/login');
      return;
    }

    const userRole = session.user.role as Role;
    console.log('[Dashboard] Current user role:', userRole);

    if (userRole === 'ADMIN') {
      console.log('[Dashboard] Redirecting to admin dashboard');
      router.replace('/dashboard/admin');
    } else if (userRole === 'MANAGER') {
      console.log('[Dashboard] Redirecting to manager dashboard');
      router.replace('/dashboard/manager');
    } else {
      console.log('[Dashboard] Redirecting to employee dashboard');
      router.replace('/dashboard/employee');
    }
  }, [session, status, router, update]);

  return null;
} 