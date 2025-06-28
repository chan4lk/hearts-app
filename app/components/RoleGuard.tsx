'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { hasAccess, getDefaultRedirectPath } from '@/app/utils/roleAccess';
import { Role } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  redirectPath?: string;
}

export default function RoleGuard({ children, allowedRoles, redirectPath }: RoleGuardProps) {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    // Force session update to get latest role
    const updateSession = async () => {
      await update();
    };
    updateSession();

    if (!session?.user) {
      console.log('[RoleGuard] No session, redirecting to login');
      router.push('/login');
      return;
    }

    const userRole = session.user.role as Role;
    
    if (!allowedRoles.includes(userRole)) {
      console.log(`[RoleGuard] User role ${userRole} not in allowed roles:`, allowedRoles);
      const defaultPath = redirectPath || getDefaultRedirectPath(userRole);
      console.log(`[RoleGuard] Redirecting to: ${defaultPath}`);
      router.push(defaultPath);
    }
  }, [session, status, router, allowedRoles, redirectPath, update]);

  if (status === 'loading' || !session?.user) {
    return null;
  }

  return <>{children}</>;
} 