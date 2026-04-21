/**
 * API route tests for /api/goals POST — manager assign-to-own-report rules.
 *
 * Strategy: mock the libs the route depends on (prisma, tenantScope,
 * auditLog, badges) and exercise the handler directly. Fast, deterministic,
 * no DB required.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { TenantContext } from '../lib/tenantScope';

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

let currentCtx: TenantContext | null = null;

const mockPrisma = {
  user: { findFirst: vi.fn() },
  goal: { create: vi.fn() },
};

vi.mock('../lib/tenantScope', () => ({
  getTenantContext: () => Promise.resolve(currentCtx),
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('../lib/auditLog', () => ({
  logAudit: vi.fn(() => Promise.resolve()),
  AuditAction: { GOAL_CREATED: 'GOAL_CREATED', GOAL_ASSIGNED: 'GOAL_ASSIGNED' },
}));

vi.mock('../lib/badges', () => ({
  checkAndAwardBadges: vi.fn(() => Promise.resolve()),
}));

function ctx(role: Role, userId = 'user-1', tenantId = 't1'): TenantContext {
  return { userId, tenantId, userRole: role, userName: 'X', userEmail: 'x@y.com' };
}

function req(body: any): NextRequest {
  return new NextRequest('http://localhost/api/goals', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/goals — RBAC for assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentCtx = null;
    mockPrisma.goal.create.mockResolvedValue({
      id: 'g1',
      title: 't',
      ownerId: 'u2',
      status: 'PENDING',
      owner: { id: 'u2', name: 'X' },
      assigner: null,
    });
  });

  it('returns 401 when not authenticated', async () => {
    currentCtx = null;
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'A' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid body (empty title)', async () => {
    currentCtx = ctx('EMPLOYEE', `emp-${Math.random()}`);
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: '' }));
    expect(res.status).toBe(400);
  });

  it('employee creating self-goal succeeds (DRAFT)', async () => {
    const userId = `emp-${Math.random()}`;
    currentCtx = ctx('EMPLOYEE', userId);
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'My goal' }));
    expect(res.status).toBe(201);
    expect(mockPrisma.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: userId, status: 'DRAFT', assignerId: null }),
      })
    );
  });

  it('employee cannot assign a goal to someone else', async () => {
    currentCtx = ctx('EMPLOYEE', `emp-${Math.random()}`);
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'T', ownerId: 'someone-else' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
    expect(mockPrisma.goal.create).not.toHaveBeenCalled();
  });

  it('manager can assign to own direct report', async () => {
    const mgrId = `mgr-${Math.random()}`;
    currentCtx = ctx('MANAGER', mgrId);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'emp1', managerId: mgrId, isActive: true });
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'T', ownerId: 'emp1' }));
    expect(res.status).toBe(201);
    expect(mockPrisma.goal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: 'emp1', status: 'PENDING', assignerId: mgrId }),
      })
    );
  });

  it('manager CANNOT assign to a user who is not their direct report', async () => {
    const mgrId = `mgr-${Math.random()}`;
    currentCtx = ctx('MANAGER', mgrId);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'emp1', managerId: 'other-mgr', isActive: true });
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'T', ownerId: 'emp1' }));
    expect(res.status).toBe(403);
    expect(mockPrisma.goal.create).not.toHaveBeenCalled();
  });

  it('admin also CANNOT assign to a user who is not their direct report (strict rule)', async () => {
    const adminId = `admin-${Math.random()}`;
    currentCtx = ctx('ADMIN', adminId);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'emp1', managerId: 'some-mgr', isActive: true });
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'T', ownerId: 'emp1' }));
    expect(res.status).toBe(403);
    expect(mockPrisma.goal.create).not.toHaveBeenCalled();
  });

  it('returns 404 when assigned employee does not exist', async () => {
    const mgrId = `mgr-${Math.random()}`;
    currentCtx = ctx('MANAGER', mgrId);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    const { POST } = await import('../app/api/goals/route');
    const res = await POST(req({ title: 'T', ownerId: 'ghost' }));
    expect(res.status).toBe(404);
  });

  it('sanitizes title (strips HTML/control chars)', async () => {
    const userId = `emp-${Math.random()}`;
    currentCtx = ctx('EMPLOYEE', userId);
    const { POST } = await import('../app/api/goals/route');
    await POST(req({ title: '<script>alert(1)</script>Real title' }));
    const createdWith = mockPrisma.goal.create.mock.calls[0]?.[0]?.data?.title;
    expect(createdWith).not.toMatch(/<script>/i);
    expect(createdWith).toMatch(/Real title/);
  });
});
