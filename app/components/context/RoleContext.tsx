'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { getAvailableRoles } from '@/lib/auth';

interface RoleContextType {
  activeRole: Role;
  availableRoles: Role[];
  setActiveRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [activeRole, setActiveRole] = useState<Role>(
    (session?.user?.activeRole || session?.user?.role || 'EMPLOYEE') as Role
  );
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (session?.user?.role) {
      const roles = getAvailableRoles(session.user.role as Role);
      setAvailableRoles(roles);
      // Initialize active role if not set
      if (!session.user.activeRole) {
        setActiveRole(session.user.role as Role);
      }
    }
  }, [session]);

  const handleSetActiveRole = (role: Role) => {
    if (availableRoles.includes(role)) {
      setActiveRole(role);
      // Store in localStorage for persistence
      localStorage.setItem('activeRole', role);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        activeRole,
        availableRoles,
        setActiveRole: handleSetActiveRole,
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