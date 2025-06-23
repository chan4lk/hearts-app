import { Role } from '@prisma/client';

// Define dashboard behaviors
export type DashboardBehavior = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

// Define which behaviors each role has access to
export const ROLE_BEHAVIORS: Record<Role, DashboardBehavior[]> = {
  ADMIN: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  MANAGER: ['MANAGER', 'EMPLOYEE'],
  EMPLOYEE: ['EMPLOYEE'],
};

// Define dashboard routes
export const DASHBOARD_ROUTES = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee',
} as const;

// Check if a role has access to a specific behavior
export const hasAccess = (role: Role, behavior: DashboardBehavior): boolean => {
  return ROLE_BEHAVIORS[role].includes(behavior);
};

// Get available dashboard routes for a role
export const getAvailableDashboards = (role: Role): string[] => {
  return ROLE_BEHAVIORS[role].map(behavior => DASHBOARD_ROUTES[behavior]);
};

// Get the default dashboard for a role
export const getDefaultDashboard = (role: Role): string => {
  // Return the highest level dashboard available for the role
  return DASHBOARD_ROUTES[ROLE_BEHAVIORS[role][0]];
};

// Get behaviors available for a role
export const getAvailableBehaviors = (role: Role): DashboardBehavior[] => {
  return ROLE_BEHAVIORS[role];
}; 