/**
 * Security Utilities
 * Handles rate limiting, validation, and security checks
 */

import { prisma } from './prisma';

const RATE_LIMIT_CONFIG = {
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  LOGIN_RESET_AFTER: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: true,
};

/**
 * Check if account is locked due to failed login attempts
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: 'insensitive',
      },
    },
    select: {
      failedLoginAttempts: true,
      lastLoginAttempt: true,
    },
  });

  if (!user) return false;

  // Account locked if exceeded max attempts within lockout duration
  if (user.failedLoginAttempts >= RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS) {
    const timeSinceLastAttempt = Date.now() - (user.lastLoginAttempt?.getTime() || 0);

    // Still within lockout period
    if (timeSinceLastAttempt < RATE_LIMIT_CONFIG.LOGIN_LOCKOUT_DURATION) {
      return true;
    }

    // Lockout period expired, reset attempts
    await resetFailedLoginAttempts(email);
    return false;
  }

  // Reset attempts if outside reset window
  if (user.lastLoginAttempt) {
    const timeSinceLastAttempt = Date.now() - user.lastLoginAttempt.getTime();
    if (timeSinceLastAttempt > RATE_LIMIT_CONFIG.LOGIN_RESET_AFTER) {
      await resetFailedLoginAttempts(email);
    }
  }

  return false;
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedLoginAttempts(email: string): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastLoginAttempt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error incrementing failed login attempts:', error);
  }
}

/**
 * Reset failed login attempts
 */
export async function resetFailedLoginAttempts(email: string): Promise<void> {
  try {
    await prisma.user.updateMany({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error resetting failed login attempts:', error);
  }
}

/**
 * Get remaining login attempts
 */
export async function getRemainingLoginAttempts(email: string): Promise<number> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: 'insensitive',
      },
    },
    select: {
      failedLoginAttempts: true,
    },
  });

  if (!user) return RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS;

  return Math.max(0, RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS - user.failedLoginAttempts);
}

/**
 * Get time remaining for account lockout (in seconds)
 */
export async function getAccountLockoutTimeRemaining(email: string): Promise<number> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: 'insensitive',
      },
    },
    select: {
      failedLoginAttempts: true,
      lastLoginAttempt: true,
    },
  });

  if (!user || user.failedLoginAttempts < RATE_LIMIT_CONFIG.LOGIN_MAX_ATTEMPTS) {
    return 0;
  }

  const timeSinceLastAttempt = Date.now() - (user.lastLoginAttempt?.getTime() || 0);
  const timeRemaining = RATE_LIMIT_CONFIG.LOGIN_LOCKOUT_DURATION - timeSinceLastAttempt;

  return Math.max(0, Math.ceil(timeRemaining / 1000));
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < RATE_LIMIT_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must be at least ${RATE_LIMIT_CONFIG.PASSWORD_MIN_LENGTH} characters long`
    );
  }

  if (RATE_LIMIT_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (RATE_LIMIT_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (RATE_LIMIT_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (RATE_LIMIT_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if user account is active and accessible
 */
export async function validateUserAccount(
  email: string
): Promise<{ isValid: boolean; reason?: string }> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email.trim(),
        mode: 'insensitive',
      },
    },
    select: {
      isActive: true,
      role: true,
    },
  });

  if (!user) {
    return { isValid: false, reason: 'User not found' };
  }

  if (!user.isActive) {
    return { isValid: false, reason: 'User account is inactive' };
  }

  return { isValid: true };
}

/**
 * Validate manager circular reference
 */
export async function validateManagerHierarchy(
  userId: string,
  newManagerId: string
): Promise<{ isValid: boolean; reason?: string }> {
  if (userId === newManagerId) {
    return { isValid: false, reason: 'User cannot be their own manager' };
  }

  // Check for circular reference
  let currentUserId = newManagerId;
  const visited = new Set<string>();

  while (currentUserId) {
    if (visited.has(currentUserId)) {
      return {
        isValid: false,
        reason: 'Circular manager reference detected',
      };
    }

    if (currentUserId === userId) {
      return {
        isValid: false,
        reason: 'Setting this manager would create a circular hierarchy',
      };
    }

    visited.add(currentUserId);

    // Get next manager in chain
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { managerId: true },
    });

    currentUserId = user?.managerId || '';
  }

  return { isValid: true };
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .substring(0, maxLength)
    .replace(/[<>"'&]/g, char => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return map[char] || char;
    });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate ID format — supports both CUID and UUID formats.
 * CUID: starts with 'c' followed by 20-32 lowercase alphanumeric chars (e.g., cmn8punvk0001lx8gk7fo5nyy)
 * UUID: standard 8-4-4-4-12 hex format
 */
export function isValidUUID(id: string): boolean {
  const CUID_REGEX = /^c[a-z0-9]{20,32}$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return CUID_REGEX.test(id) || UUID_REGEX.test(id);
}

/**
 * Check if role has permission for action
 */
export function hasPermission(
  role: string,
  resource: string,
  action: string
): boolean {
  const permissions: Record<string, Record<string, string[]>> = {
    ADMIN: {
      users: ['create', 'read', 'update', 'delete'],
      goals: ['create', 'read', 'update', 'delete'],
      ratings: ['create', 'read', 'update', 'delete'],
      reviewCycles: ['create', 'read', 'update', 'delete'],
      analytics: ['read'],
    },
    MANAGER: {
      users: ['read'], // Can only view their team
      goals: ['create', 'read', 'update'], // Can set, view, update
      ratings: ['create', 'read', 'update'], // Can rate goals
      reviewCycles: ['read'],
      analytics: ['read'], // Limited analytics
    },
    EMPLOYEE: {
      users: ['read'], // Can only view themselves
      goals: ['create', 'read', 'update'], // Can create and manage own goals
      ratings: ['create', 'read'], // Can self-rate
      reviewCycles: ['read'],
      analytics: [], // No analytics access
    },
  };

  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;

  const resourceActions = rolePermissions[resource];
  if (!resourceActions) return false;

  return resourceActions.includes(action);
}

/**
 * Check if user has access to resource (ID-based)
 */
export async function hasResourceAccess(
  userId: string,
  userRole: string,
  resource: string,
  resourceId: string,
  action: string
): Promise<boolean> {
  // Admins have access to everything
  if (userRole === 'ADMIN') {
    return true;
  }

  // Check role-based permissions first
  if (!hasPermission(userRole, resource, action)) {
    return false;
  }

  // Additional resource-specific checks
  if (resource === 'goals') {
    const goal = await prisma.goal.findUnique({
      where: { id: resourceId },
      select: { employeeId: true, managerId: true, createdById: true },
    });

    if (!goal) return false;

    if (userRole === 'EMPLOYEE') {
      // Employee can only access their own goals
      return goal.employeeId === userId;
    }

    if (userRole === 'MANAGER') {
      // Manager can access goals of their team members
      return goal.managerId === userId || goal.employeeId === userId;
    }
  }

  if (resource === 'ratings') {
    const rating = await prisma.rating.findUnique({
      where: { id: resourceId },
      include: { goal: true },
    });

    if (!rating || !rating.goal) return false;

    if (userRole === 'EMPLOYEE') {
      // Employee can access their own ratings
      return rating.goal.employeeId === userId;
    }

    if (userRole === 'MANAGER') {
      // Manager can access ratings of their team members
      return rating.goal.managerId === userId;
    }
  }

  return true;
}

/**
 * Generate security report
 */
export async function generateSecurityReport() {
  const lockedAccounts = await prisma.user.count({
    where: {
      failedLoginAttempts: { gte: 5 },
    },
  });

  const inactiveAccounts = await prisma.user.count({
    where: {
      isActive: false,
    },
  });

  const adminUsers = await prisma.user.count({
    where: {
      role: 'ADMIN',
    },
  });

  const usersWithoutManager = await prisma.user.count({
    where: {
      role: 'EMPLOYEE',
      managerId: null,
    },
  });

  return {
    lockedAccounts,
    inactiveAccounts,
    adminUserCount: adminUsers,
    unassignedEmployees: usersWithoutManager,
    reportedAt: new Date().toISOString(),
  };
}
