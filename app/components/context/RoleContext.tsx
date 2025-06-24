'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { getAvailableRoles } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';

interface RoleContextType {
  activeRole: Role;
  availableRoles: Role[];
  setActiveRole: (role: Role) => void;
  switchToRole: (role: Role) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_ROUTES = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee',
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeRole, setActiveRole] = useState<Role>(
    (session?.user?.activeRole || session?.user?.role || 'EMPLOYEE') as Role
  );
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  // Initialize roles when session changes
  useEffect(() => {
    if (session?.user?.role) {
      const roles = getAvailableRoles(session.user.role as Role);
      setAvailableRoles(roles);
      
      // Initialize active role from localStorage or session
      const storedRole = localStorage.getItem('activeRole');
      if (storedRole && roles.includes(storedRole as Role)) {
        setActiveRole(storedRole as Role);
      } else if (session.user.activeRole && roles.includes(session.user.activeRole)) {
        setActiveRole(session.user.activeRole);
      } else {
        setActiveRole(session.user.role as Role);
        localStorage.setItem('activeRole', session.user.role);
      }
    }
  }, [session]);

  // Handle role switching with navigation
  const switchToRole = async (newRole: Role) => {
    if (!availableRoles.includes(newRole)) return;

    setActiveRole(newRole);
    localStorage.setItem('activeRole', newRole);

    // Get the current path segments
    const pathSegments = pathname?.split('/') || [];
    const currentRole = pathSegments[2]?.toUpperCase() as Role;
    const currentSection = pathSegments[3];

    // If we're not in any dashboard yet, go to the new role's dashboard
    if (!currentRole || !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(currentRole)) {
      router.push(ROLE_ROUTES[newRole]);
      return;
    }

    // If switching to the same role type, don't navigate
    if (currentRole === newRole) return;

    // Navigate to the corresponding section in the new role's dashboard if available
    if (currentSection) {
      const newPath = `${ROLE_ROUTES[newRole]}/${currentSection}`;
      router.push(newPath);
    } else {
      router.push(ROLE_ROUTES[newRole]);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        availableRoles,
        setActiveRole,
        switchToRole,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
} 