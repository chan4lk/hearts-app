'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login');
      return;
    }
    if (session.user.role === 'ADMIN') {
      router.replace('/dashboard/admin');
    } else if (session.user.role === 'MANAGER') {
      router.replace('/dashboard/manager');
    } else {
      router.replace('/dashboard/employee');
    }
  }, [session, status, router]);

  return null;
} 