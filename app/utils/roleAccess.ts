import { IconType } from 'react-icons';
import { Role } from '@prisma/client';
import { 
  BsGrid, 
  BsBullseye,
  BsStar,
  BsChat,
  BsBarChart,
  BsPerson,
  BsGear,
  BsShield,
  BsGraphUp,
  BsClipboardData,
  BsBell,
  BsPeople
} from 'react-icons/bs';

// Map database roles to dashboard paths
export const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee'
};

export interface NavItem {
  href: string;
  icon: IconType;
  label: string;
  roles: Role[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  // Dashboard items
  {
    href: '/dashboard/employee',
    icon: BsGrid,
    label: 'Employee Dashboard',
    roles: [Role.EMPLOYEE, Role.MANAGER, Role.ADMIN]
  },
  {
    href: '/dashboard/manager',
    icon: BsGrid,
    label: 'Manager Dashboard',
    roles: [Role.MANAGER, Role.ADMIN]
  },
  {
    href: '/dashboard/admin',
    icon: BsGrid,
    label: 'Admin Dashboard',
    roles: [Role.ADMIN]
  },

  // Employee items
  {
    href: '/dashboard/employee/goals/create',
    icon: BsBullseye,
    label: 'Create Goals',
    roles: [Role.EMPLOYEE, Role.MANAGER, Role.ADMIN]
  },
  {
    href: '/dashboard/employee/self-rating',
    icon: BsStar,
    label: 'Self Rating',
    roles: [Role.EMPLOYEE, Role.MANAGER, Role.ADMIN]
  },

  // Manager items
  {
    href: '/dashboard/manager/goals/approve-goals',
    icon: BsClipboardData,
    label: 'Goal Approvals',
    roles: [Role.MANAGER, Role.ADMIN]
  },
  {
    href: '/dashboard/manager/goals/setgoals',
    icon: BsBullseye,
    label: 'Set Goals',
    roles: [Role.MANAGER, Role.ADMIN]
  },
  {
    href: '/dashboard/manager/rate-employees',
    icon: BsStar,
    label: 'Rate Employees',
    roles: [Role.MANAGER, Role.ADMIN]
  },

  // Admin items
  {
    href: '/dashboard/admin/users',
    icon: BsPeople,
    label: 'Manage Users',
    roles: [Role.ADMIN]
  },
  {
    href: '/dashboard/admin/goals',
    icon: BsBullseye,
    label: 'Goal Settings',
    roles: [Role.ADMIN]
  }
];

export const getNavItemsByRole = (role: Role): NavItem[] => {
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
};

// Define role access levels
const ROLE_ACCESS = {
  'ADMIN': {
    canAccess: [
      // Admin paths
      '/dashboard/admin',
      '/dashboard/admin/users',
      '/dashboard/admin/goals',
      // Manager paths - full access
      '/dashboard/manager',
      '/dashboard/manager/goals',
      '/dashboard/manager/goals/approve-goals',
      '/dashboard/manager/goals/setgoals',
      '/dashboard/manager/rate-employees',
      // Employee paths - full access
      '/dashboard/employee',
      '/dashboard/employee/goals',
      '/dashboard/employee/goals/create',
      '/dashboard/employee/self-rating'
    ],
    defaultPath: '/dashboard/admin'
  },
  'MANAGER': {
    canAccess: [
      // Manager paths
      '/dashboard/manager',
      '/dashboard/manager/goals',
      '/dashboard/manager/goals/approve-goals',
      '/dashboard/manager/goals/setgoals',
      '/dashboard/manager/rate-employees',
      // Employee paths - full access
      '/dashboard/employee',
      '/dashboard/employee/goals',
      '/dashboard/employee/goals/create',
      '/dashboard/employee/self-rating'
    ],
    defaultPath: '/dashboard/manager'
  },
  'EMPLOYEE': {
    canAccess: [
      // Employee paths only
      '/dashboard/employee',
      '/dashboard/employee/goals',
      '/dashboard/employee/goals/create',
      '/dashboard/employee/self-rating'
    ],
    defaultPath: '/dashboard/employee'
  }
} as const;

export const hasAccess = (role: Role, path: string): boolean => {
  console.log('[roleAccess] Checking access:', {
    role,
    path,
    availablePaths: ROLE_ACCESS[role]?.canAccess || []
  });

  // Get the role's access configuration
  const roleConfig = ROLE_ACCESS[role];
  if (!roleConfig) {
    console.log('[roleAccess] No role configuration found:', { role });
    return false;
  }

  // For admin role, allow access to all dashboard paths
  if (role === 'ADMIN' && path.startsWith('/dashboard/')) {
    console.log('[roleAccess] Admin access granted:', { path });
    return true;
  }

  // For other roles, check specific path access
  const hasAccess = roleConfig.canAccess.some(allowedPath => {
    const pathMatches = path.startsWith(allowedPath);
    console.log('[roleAccess] Checking path match:', {
      allowedPath,
      requestPath: path,
      matches: pathMatches
    });
    return pathMatches;
  });

  console.log('[roleAccess] Access check result:', {
    role,
    path,
    hasAccess,
    allowedPaths: roleConfig.canAccess
  });

  return hasAccess;
};

export const getDefaultRedirectPath = (role: Role): string => {
  console.log('[roleAccess] Getting default path:', {
    role,
    defaultPath: ROLE_ACCESS[role]?.defaultPath || ROLE_ACCESS['EMPLOYEE'].defaultPath
  });

  return ROLE_ACCESS[role]?.defaultPath || ROLE_ACCESS['EMPLOYEE'].defaultPath;
};

export const getRoleBasedTitle = (role: Role): string => {
  return `${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()} Portal`;
};

export const getRoleColor = (role: Role): string => {
  switch (role) {
    case Role.ADMIN:
      return 'text-purple-500 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20';
    case Role.MANAGER:
      return 'text-blue-500 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20';
    case Role.EMPLOYEE:
      return 'text-green-500 bg-green-100 dark:text-green-300 dark:bg-green-900/20';
    default:
      return 'text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20';
  }
}; 