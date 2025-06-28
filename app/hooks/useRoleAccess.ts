'use client';

import { useSession } from 'next-auth/react';
import { hasAccess, getDefaultRedirectPath, getNavItemsByRole } from '@/app/utils/roleAccess';
import { Role } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useRoleAccess() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // Force session update to get latest role
    const updateSession = async () => {
      await update();
    };
    updateSession();

    if (!session?.user) {
      console.log('[useRoleAccess] No session, redirecting to login');
      router.push('/login');
      return;
    }

    const userRole = session.user.role as Role;

    if (!hasAccess(userRole, pathname)) {
      console.log(`[useRoleAccess] User role ${userRole} does not have access to ${pathname}`);
      const defaultPath = getDefaultRedirectPath(userRole);
      console.log(`[useRoleAccess] Redirecting to: ${defaultPath}`);
      router.push(defaultPath);
    }
  }, [session, status, router, update, pathname]);

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
    navItems: getNavItemsByRole(userRole, pathname),
  };
} 