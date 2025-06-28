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

const ROLE_HIERARCHY = {
  ADMIN: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  MANAGER: ['MANAGER', 'EMPLOYEE'],
  EMPLOYEE: ['EMPLOYEE']
};

export const hasAccess = (role: Role, path: string): boolean => {
  const allowedRoles = ROLE_HIERARCHY[role] || [];

  // Check path against role permissions
  if (path.startsWith('/dashboard/admin')) {
    return allowedRoles.includes('ADMIN');
  }

  if (path.startsWith('/dashboard/manager')) {
    return allowedRoles.includes('MANAGER');
  }

  if (path.startsWith('/dashboard/employee')) {
    return allowedRoles.includes('EMPLOYEE');
  }

  // Default to false for unknown paths
  return false;
};

export const getDefaultRedirectPath = (role: Role): string => {
  const dashboardPaths = {
    ADMIN: '/dashboard/admin',
    MANAGER: '/dashboard/manager',
    EMPLOYEE: '/dashboard/employee'
  };

  return dashboardPaths[role] || dashboardPaths.EMPLOYEE;
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