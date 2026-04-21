/**
 * Pluggable fixed-window rate limiter.
 *
 * Default store is in-memory (per-process). For horizontal scale across Next.js
 * instances, set `RATELIMIT_STORE=redis` and `REDIS_URL=...`, then install a
 * client (e.g. `@upstash/redis` or `ioredis`) and wire it up in `getStore()`.
 *
 * Fail-open on errors — a broken cache must never take down the app.
 */

import { NextResponse } from 'next/server';

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

interface Store {
  hit(key: string, max: number, windowMs: number): Promise<RateLimitResult>;
}

// ── In-memory store ─────────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  buckets.forEach((b, key) => {
    if (b.resetAt < now) buckets.delete(key);
  });
  lastSweep = now;
}

const memoryStore: Store = {
  async hit(key, max, windowMs) {
    const now = Date.now();
    sweep(now);
    const b = buckets.get(key);
    if (!b || b.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true, remaining: max - 1, resetAt: now + windowMs, retryAfterSec: 0 };
    }
    if (b.count >= max) {
      return { ok: false, remaining: 0, resetAt: b.resetAt, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
    }
    b.count++;
    return { ok: true, remaining: max - b.count, resetAt: b.resetAt, retryAfterSec: 0 };
  },
};

// ── Redis store (stub — wire a client when you scale horizontally) ──────────
// To enable:
//   1. `npm i @upstash/redis` (or ioredis)
//   2. Set REDIS_URL + RATELIMIT_STORE=redis
//   3. Replace the body below with an INCR + EXPIRE pipeline.
function makeRedisStore(): Store {
  // eslint-disable-next-line no-console
  console.warn('[rateLimit] RATELIMIT_STORE=redis requested but no Redis client wired — falling back to memory.');
  return memoryStore;
}

let storeInstance: Store | null = null;
function getStore(): Store {
  if (storeInstance) return storeInstance;
  storeInstance = process.env.RATELIMIT_STORE === 'redis' ? makeRedisStore() : memoryStore;
  return storeInstance;
}

/**
 * Check and increment a rate-limit bucket.
 */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  try {
    return await getStore().hit(key, max, windowMs);
  } catch {
    // Fail-open
    return { ok: true, remaining: max - 1, resetAt: Date.now() + windowMs, retryAfterSec: 0 };
  }
}

/**
 * Express/Next-style helper: returns a 429 NextResponse if the bucket is full,
 * otherwise returns null so the caller can proceed.
 *
 * Backwards-compatible sync signature — callers that awaited or didn't await
 * continue to work; new code should `await` for Redis correctness.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): NextResponse | null {
  const now = Date.now();

  // Synchronous path for the in-memory store (preserves existing call sites).
  if (process.env.RATELIMIT_STORE !== 'redis') {
    sweep(now);
    const b = buckets.get(key);
    if (!b || b.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }
    if (b.count >= max) {
      const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${retryAfterSec}s.`, code: 'RATE_LIMITED', retryAfterSec },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(b.resetAt / 1000)),
          },
        }
      );
    }
    b.count++;
    return null;
  }

  // Redis mode: use the async helper.
  return null;
}

/**
 * Async version — prefer this for new call sites so Redis is awaited correctly.
 */
export async function checkRateLimitAsync(
  key: string,
  max: number,
  windowMs: number
): Promise<NextResponse | null> {
  const r = await rateLimit(key, max, windowMs);
  if (r.ok) return null;
  return NextResponse.json(
    { error: `Rate limit exceeded. Try again in ${r.retryAfterSec}s.`, code: 'RATE_LIMITED', retryAfterSec: r.retryAfterSec },
    {
      status: 429,
      headers: {
        'Retry-After': String(r.retryAfterSec),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(r.resetAt / 1000)),
      },
    }
  );
}
