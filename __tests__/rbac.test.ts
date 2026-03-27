import { describe, it, expect } from 'vitest';
import { hasMinRole, hasRole, isManagerOf } from '../lib/rbac';
import { TenantContext } from '../lib/tenantScope';

function mockCtx(role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE', userId = 'user-1'): TenantContext {
  return {
    tenantId: 'bistec-global',
    userId,
    userRole: role,
    userName: 'Test User',
    userEmail: 'test@example.com',
  };
}

describe('RBAC - hasMinRole (cascading)', () => {
  it('ADMIN has min role ADMIN', () => {
    expect(hasMinRole(mockCtx('ADMIN'), 'ADMIN')).toBe(true);
  });

  it('ADMIN has min role MANAGER (cascading)', () => {
    expect(hasMinRole(mockCtx('ADMIN'), 'MANAGER')).toBe(true);
  });

  it('ADMIN has min role EMPLOYEE (cascading)', () => {
    expect(hasMinRole(mockCtx('ADMIN'), 'EMPLOYEE')).toBe(true);
  });

  it('MANAGER has min role MANAGER', () => {
    expect(hasMinRole(mockCtx('MANAGER'), 'MANAGER')).toBe(true);
  });

  it('MANAGER has min role EMPLOYEE (cascading)', () => {
    expect(hasMinRole(mockCtx('MANAGER'), 'EMPLOYEE')).toBe(true);
  });

  it('MANAGER does NOT have min role ADMIN', () => {
    expect(hasMinRole(mockCtx('MANAGER'), 'ADMIN')).toBe(false);
  });

  it('EMPLOYEE has min role EMPLOYEE', () => {
    expect(hasMinRole(mockCtx('EMPLOYEE'), 'EMPLOYEE')).toBe(true);
  });

  it('EMPLOYEE does NOT have min role MANAGER', () => {
    expect(hasMinRole(mockCtx('EMPLOYEE'), 'MANAGER')).toBe(false);
  });

  it('EMPLOYEE does NOT have min role ADMIN', () => {
    expect(hasMinRole(mockCtx('EMPLOYEE'), 'ADMIN')).toBe(false);
  });
});

describe('RBAC - hasRole (exact match)', () => {
  it('ADMIN matches ADMIN', () => {
    expect(hasRole(mockCtx('ADMIN'), 'ADMIN')).toBe(true);
  });

  it('ADMIN does NOT match MANAGER (no cascading)', () => {
    expect(hasRole(mockCtx('ADMIN'), 'MANAGER')).toBe(false);
  });

  it('MANAGER matches ADMIN or MANAGER (multi-role check)', () => {
    expect(hasRole(mockCtx('MANAGER'), 'ADMIN', 'MANAGER')).toBe(true);
  });

  it('EMPLOYEE does NOT match ADMIN or MANAGER', () => {
    expect(hasRole(mockCtx('EMPLOYEE'), 'ADMIN', 'MANAGER')).toBe(false);
  });
});

describe('RBAC - isManagerOf', () => {
  it('returns true when user is the assigned manager', () => {
    expect(isManagerOf(mockCtx('MANAGER', 'mgr-1'), 'mgr-1')).toBe(true);
  });

  it('returns false when user is NOT the assigned manager', () => {
    expect(isManagerOf(mockCtx('MANAGER', 'mgr-1'), 'mgr-2')).toBe(false);
  });

  it('ADMIN can act as any manager', () => {
    expect(isManagerOf(mockCtx('ADMIN', 'admin-1'), 'mgr-2')).toBe(true);
  });

  it('returns false for null managerId (unassigned employee)', () => {
    expect(isManagerOf(mockCtx('MANAGER', 'mgr-1'), null)).toBe(false);
  });

  it('ADMIN returns true even for null managerId', () => {
    expect(isManagerOf(mockCtx('ADMIN', 'admin-1'), null)).toBe(true);
  });
});
