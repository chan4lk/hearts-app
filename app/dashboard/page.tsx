'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ROLE_PATHS: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee',
};

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.replace('/login');
      return;
    }
    router.replace(ROLE_PATHS[session.user.role] || '/dashboard/employee');
  }, [session, status, router]);

  return null;
}
