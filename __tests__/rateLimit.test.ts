import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, checkRateLimit } from '../lib/rateLimit';

describe('rateLimit — in-memory store', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows up to `max` hits within the window', async () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const r = await rateLimit(key, 5, 60_000);
      expect(r.ok).toBe(true);
      expect(r.remaining).toBe(5 - (i + 1));
    }
  });

  it('rejects the next hit after the bucket is full', async () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) await rateLimit(key, 3, 60_000);
    const r = await rateLimit(key, 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it('resets the bucket after the window elapses', async () => {
    const key = `test:${Math.random()}`;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    for (let i = 0; i < 2; i++) await rateLimit(key, 2, 1000);
    const blocked = await rateLimit(key, 2, 1000);
    expect(blocked.ok).toBe(false);

    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'));
    const afterReset = await rateLimit(key, 2, 1000);
    expect(afterReset.ok).toBe(true);
  });

  it('checkRateLimit returns null when allowed, 429 when blocked', () => {
    const key = `test:${Math.random()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBeNull();
    expect(checkRateLimit(key, 2, 60_000)).toBeNull();
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get('Retry-After')).toBeTruthy();
  });

  it('isolates buckets per key', async () => {
    await rateLimit('alice', 1, 60_000);
    await rateLimit('alice', 1, 60_000); // alice is now full
    const bob = await rateLimit('bob', 1, 60_000);
    expect(bob.ok).toBe(true);
  });
});
