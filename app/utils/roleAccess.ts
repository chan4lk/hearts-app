import { IconType } from 'react-icons';

// Define Role type locally
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

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
  BsPeople,
  BsChatSquareText
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
  context?: 'admin' | 'manager' | 'employee';  // Which dashboard context this item belongs to
}

// Navigation items grouped by dashboard context
const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard/admin',
    icon: BsGrid,
    label: 'Admin Overview',
    roles: ['ADMIN'],
    context: 'admin'
  },
  {
    href: '/dashboard/admin/users',
    icon: BsPeople,
    label: 'Manage Users',
    roles: ['ADMIN'],
    context: 'admin'
  },
  {
    href: '/dashboard/admin/goals',
    icon: BsBullseye,
    label: 'Goal Settings',
    roles: ['ADMIN'],
    context: 'admin'
  },
  {
    href: '/dashboard/feedback-360/admin',
    icon: BsChatSquareText,
    label: '360° Feedback',
    roles: ['ADMIN'],
    context: 'admin'
  }
];

const MANAGER_NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard/manager',
    icon: BsGrid,
    label: 'Manager Overview',
    roles: ['MANAGER', 'ADMIN'],
    context: 'manager'
  },
  {
    href: '/dashboard/manager/goals/approve-goals',
    icon: BsClipboardData,
    label: 'Goal Approvals',
    roles: ['MANAGER', 'ADMIN'],
    context: 'manager'
  },
  {
    href: '/dashboard/manager/goals/setgoals',
    icon: BsBullseye,
    label: 'Set Goals',
    roles: ['MANAGER', 'ADMIN'],
    context: 'manager'
  },
  {
    href: '/dashboard/manager/rate-employees',
    icon: BsStar,
    label: 'Rate Employees',
    roles: ['MANAGER', 'ADMIN'],
    context: 'manager'
  },
  {
    href: '/dashboard/feedback-360/manager',
    icon: BsChatSquareText,
    label: '360° Feedback',
    roles: ['MANAGER', 'ADMIN'],
    context: 'manager'
  }
];

const EMPLOYEE_NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard/employee',
    icon: BsGrid,
    label: 'Employee Overview',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
    context: 'employee'
  },
  {
    href: '/dashboard/employee/goals/create',
    icon: BsBullseye,
    label: 'Create Goals',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
    context: 'employee'
  },
  {
    href: '/dashboard/employee/self-rating',
    icon: BsStar,
    label: 'Self Rating',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
    context: 'employee'
  },
  {
    href: '/dashboard/feedback-360/results',
    icon: BsChatSquareText,
    label: '360° Feedback',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'],
    context: 'employee'
  }
];

// Dashboard switcher items for admin
const DASHBOARD_SWITCHER: NavItem[] = [
  {
    href: '/dashboard/admin',
    icon: BsShield,
    label: 'Switch to Admin',
    roles: ['ADMIN']
  },
  {
    href: '/dashboard/manager',
    icon: BsGraphUp,
    label: 'Switch to Manager',
    roles: ['MANAGER', 'ADMIN']
  },
  {
    href: '/dashboard/employee',
    icon: BsPerson,
    label: 'Switch to Employee',
    roles: ['EMPLOYEE', 'MANAGER', 'ADMIN']
  }
];

export const getNavItemsByRole = (role: Role, currentPath: string): NavItem[] => {
  // Determine current dashboard context
  let context: 'admin' | 'manager' | 'employee' = 'employee';
  if (currentPath.startsWith('/dashboard/admin')) {
    context = 'admin';
  } else if (currentPath.startsWith('/dashboard/manager')) {
    context = 'manager';
  }

  // For admin users, show context-specific navigation plus dashboard switcher
  if (role === 'ADMIN') {
    const contextItems = (() => {
      switch (context) {
        case 'admin':
          return ADMIN_NAV_ITEMS;
        case 'manager':
          return MANAGER_NAV_ITEMS;
        case 'employee':
          return EMPLOYEE_NAV_ITEMS;
      }
    })();

    return [
      ...contextItems,
      { href: '', label: 'Switch Dashboard', icon: BsGrid, roles: ['ADMIN'] }, // Divider
      ...DASHBOARD_SWITCHER
    ];
  }

  // For other roles, show their allowed navigation items
  const allowedItems = [
    ...(role === 'MANAGER' ? MANAGER_NAV_ITEMS : []),
    ...EMPLOYEE_NAV_ITEMS
  ].filter(item => item.roles.includes(role));

  return allowedItems;
};

// Define role access levels
const ROLE_ACCESS: Record<Role, {
  canAccess: string[];
  defaultPath: string;
}> = {
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
      '/dashboard/employee/self-rating',
      // 360° Feedback paths - full access
      '/dashboard/feedback-360',
      '/dashboard/feedback-360/admin',
      '/dashboard/feedback-360/manager',
      '/dashboard/feedback-360/results',
      '/dashboard/feedback-360/submit'
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
      '/dashboard/employee/self-rating',
      // 360° Feedback paths
      '/dashboard/feedback-360',
      '/dashboard/feedback-360/manager',
      '/dashboard/feedback-360/results',
      '/dashboard/feedback-360/submit'
    ],
    defaultPath: '/dashboard/manager'
  },
  'EMPLOYEE': {
    canAccess: [
      // Employee paths only
      '/dashboard/employee',
      '/dashboard/employee/goals',
      '/dashboard/employee/goals/create',
      '/dashboard/employee/self-rating',
      // 360° Feedback paths
      '/dashboard/feedback-360',
      '/dashboard/feedback-360/results',
      '/dashboard/feedback-360/submit'
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

  // For admin role, allow access to all dashboard paths
  if (role === 'ADMIN' && path.startsWith('/dashboard/')) {
    console.log('[roleAccess] Admin access granted:', { path });
    return true;
  }

  // Get the role's access configuration
  const roleConfig = ROLE_ACCESS[role];
  if (!roleConfig) {
    console.log('[roleAccess] No role configuration found:', { role });
    return false;
  }

  // For non-admin roles, check specific path access
  const hasAccess = roleConfig.canAccess.some((allowedPath: string) => {
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
    case 'ADMIN':
      return 'text-purple-500 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20';
    case 'MANAGER':
      return 'text-blue-500 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20';
    case 'EMPLOYEE':
      return 'text-green-500 bg-green-100 dark:text-green-300 dark:bg-green-900/20';
    default:
      return 'text-gray-500 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20';
  }
}; 