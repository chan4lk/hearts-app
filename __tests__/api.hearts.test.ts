/**
 * API route tests for /api/hearts POST — rate limit, self-heart, duplicate guards.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { TenantContext } from '../lib/tenantScope';

let currentCtx: TenantContext | null = null;

const mockPrisma = {
  user: { findFirst: vi.fn() },
  companyValue: { findFirst: vi.fn() },
  heart: {
    count: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('../lib/tenantScope', () => ({
  getTenantContext: () => Promise.resolve(currentCtx),
}));

vi.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('../lib/email', () => ({
  notifyHeartReceived: vi.fn(() => Promise.resolve()),
}));

vi.mock('../lib/badges', () => ({
  checkAndAwardBadges: vi.fn(() => Promise.resolve()),
}));

function ctx(userId: string, tenantId = 't1'): TenantContext {
  return { userId, tenantId, userRole: 'EMPLOYEE', userName: 'X', userEmail: 'x@y.com' };
}

function req(body: any): NextRequest {
  return new NextRequest('http://localhost/api/hearts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/hearts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentCtx = null;
    mockPrisma.heart.count.mockResolvedValue(0);
    mockPrisma.heart.create.mockResolvedValue({
      id: 'h1',
      sender: { id: 'u1', name: 'A' },
      receiver: { id: 'u2', name: 'B' },
      valueTag: { id: 'v1', name: 'Integrity' },
    });
  });

  it('401 when unauthenticated', async () => {
    currentCtx = null;
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: 'u2', valueTagId: 'v1' }));
    expect(res.status).toBe(401);
  });

  it('400 on invalid body', async () => {
    currentCtx = ctx(`u-${Math.random()}`);
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: '' }));
    expect(res.status).toBe(400);
  });

  it('409 when giving a heart to yourself', async () => {
    const me = `u-${Math.random()}`;
    currentCtx = ctx(me);
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: me, valueTagId: 'v1' }));
    expect(res.status).toBe(409);
  });

  it('404 when receiver does not exist', async () => {
    currentCtx = ctx(`u-${Math.random()}`);
    mockPrisma.user.findFirst.mockResolvedValue(null);
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: 'ghost', valueTagId: 'v1' }));
    expect(res.status).toBe(404);
  });

  it('404 when value tag does not exist or is inactive', async () => {
    currentCtx = ctx(`u-${Math.random()}`);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', tenantId: 't1', isActive: true });
    mockPrisma.companyValue.findFirst.mockResolvedValue(null);
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: 'u2', valueTagId: 'bad' }));
    expect(res.status).toBe(404);
  });

  it('409 when 3 hearts already sent to same person today', async () => {
    currentCtx = ctx(`u-${Math.random()}`);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', tenantId: 't1', isActive: true });
    mockPrisma.companyValue.findFirst.mockResolvedValue({ id: 'v1', tenantId: 't1', isActive: true });
    mockPrisma.heart.count.mockResolvedValue(3);
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: 'u2', valueTagId: 'v1' }));
    expect(res.status).toBe(409);
  });

  it('201 on success', async () => {
    currentCtx = ctx(`u-${Math.random()}`);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', tenantId: 't1', isActive: true });
    mockPrisma.companyValue.findFirst.mockResolvedValue({ id: 'v1', tenantId: 't1', isActive: true });
    const { POST } = await import('../app/api/hearts/route');
    const res = await POST(req({ receiverId: 'u2', valueTagId: 'v1', message: 'nice' }));
    expect(res.status).toBe(201);
    expect(mockPrisma.heart.create).toHaveBeenCalledTimes(1);
  });

  it('429 after 30 hearts/hour (rate-limit bucket)', async () => {
    const me = `u-${Math.random()}`;
    currentCtx = ctx(me);
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'u2', tenantId: 't1', isActive: true });
    mockPrisma.companyValue.findFirst.mockResolvedValue({ id: 'v1', tenantId: 't1', isActive: true });
    const { POST } = await import('../app/api/hearts/route');
    for (let i = 0; i < 30; i++) {
      const r = await POST(req({ receiverId: 'u2', valueTagId: 'v1' }));
      expect(r.status).toBe(201);
    }
    const blocked = await POST(req({ receiverId: 'u2', valueTagId: 'v1' }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });
});
