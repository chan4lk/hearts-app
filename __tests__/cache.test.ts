import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cached, invalidate, invalidatePrefix } from '../lib/cache';

describe('cache — TTL + deduplication', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('returns the cached value within the TTL without recomputing', async () => {
    const key = `t:${Math.random()}`;
    const compute = vi.fn().mockResolvedValue({ n: 1 });
    const a = await cached(key, 60_000, compute);
    const b = await cached(key, 60_000, compute);
    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('recomputes after the TTL expires', async () => {
    const key = `t:${Math.random()}`;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const compute = vi.fn().mockResolvedValueOnce({ n: 1 }).mockResolvedValueOnce({ n: 2 });

    const first = await cached(key, 1000, compute);
    expect(first).toEqual({ n: 1 });

    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'));
    const second = await cached(key, 1000, compute);
    expect(second).toEqual({ n: 2 });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent misses on the same key', async () => {
    const key = `t:${Math.random()}`;
    let resolve!: (v: unknown) => void;
    const compute = vi.fn(() => new Promise((r) => { resolve = r; }));

    const p1 = cached(key, 60_000, compute as () => Promise<any>);
    const p2 = cached(key, 60_000, compute as () => Promise<any>);
    resolve({ n: 1 });
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('does not cache rejected results', async () => {
    const key = `t:${Math.random()}`;
    const compute = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ n: 7 });

    await expect(cached(key, 60_000, compute as () => Promise<any>)).rejects.toThrow('boom');
    const ok = await cached(key, 60_000, compute as () => Promise<any>);
    expect(ok).toEqual({ n: 7 });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('invalidate + invalidatePrefix remove entries', async () => {
    const compute = vi.fn().mockResolvedValue('v');
    await cached('dash:a:1', 60_000, compute);
    await cached('dash:a:2', 60_000, compute);
    await cached('other:x', 60_000, compute);
    expect(compute).toHaveBeenCalledTimes(3);

    invalidate('dash:a:1');
    await cached('dash:a:1', 60_000, compute);
    expect(compute).toHaveBeenCalledTimes(4);

    invalidatePrefix('dash:');
    await cached('dash:a:1', 60_000, compute);
    await cached('dash:a:2', 60_000, compute);
    expect(compute).toHaveBeenCalledTimes(6);

    // 'other:x' should still be cached
    await cached('other:x', 60_000, compute);
    expect(compute).toHaveBeenCalledTimes(6);
  });
});
