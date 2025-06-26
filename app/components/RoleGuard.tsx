import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { hasAccess, getDefaultRedirectPath, UserRole } from '@/app/utils/roleAccess';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = session.user.role.toLowerCase() as UserRole;
    const currentPath = window.location.pathname;

    if (!hasAccess(userRole, currentPath)) {
      router.push(getDefaultRedirectPath(userRole));
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user.role.toLowerCase() as UserRole;
  if (!allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
} 