'use client';

import { useSession } from 'next-auth/react';
import { hasAccess, getDefaultRedirectPath, getNavItemsByRole } from '@/app/utils/roleAccess';
import { Role } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRoleAccess() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      console.log('[useRoleAccess] No session, redirecting to login');
      router.push('/login');
      return;
    }

    const userRole = session.user.role as Role;
    const currentPath = window.location.pathname;

    if (!hasAccess(userRole, currentPath)) {
      console.log(`[useRoleAccess] User role ${userRole} does not have access to ${currentPath}`);
      const defaultPath = getDefaultRedirectPath(userRole);
      console.log(`[useRoleAccess] Redirecting to: ${defaultPath}`);
      router.push(defaultPath);
    }
  }, [session, status, router]);

  const isLoading = status === 'loading';

  if (!session?.user) {
    return {
      isLoading,
      role: null as Role | null,
      hasAccess: () => false,
      navItems: [],
    };
  }

  const userRole = session.user.role as Role;

  return {
    isLoading,
    role: userRole,
    hasAccess: (path: string) => hasAccess(userRole, path),
    navItems: getNavItemsByRole(userRole),
  };
} 