import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { hasAccess, getDefaultRedirectPath, UserRole, getNavItemsByRole } from '@/app/utils/roleAccess';

export function useRoleAccess() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const userRole = session?.user?.role?.toLowerCase() as UserRole;
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!hasAccess(userRole, pathname || '')) {
      router.push(getDefaultRedirectPath(userRole));
    }
  }, [isAuthenticated, isLoading, userRole, pathname, router]);

  const navItems = userRole ? getNavItemsByRole(userRole) : [];

  return {
    userRole,
    isLoading,
    isAuthenticated,
    navItems,
    hasAccess: (path: string) => hasAccess(userRole, path),
    getDefaultPath: () => getDefaultRedirectPath(userRole),
  };
} 