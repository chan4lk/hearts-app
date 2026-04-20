/**
 * In-memory token-bucket rate limiter (per-process).
 *
 * For multi-instance production scale, swap the `buckets` Map for Redis
 * (e.g., @upstash/ratelimit). This implementation is correct for a single
 * Next.js instance and is fail-open on errors (never blocks the main request).
 */

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

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Check and increment a rate-limit bucket.
 *
 * @param key     Unique bucket key, e.g. `"hearts:${userId}"`.
 * @param max     Max requests allowed per window.
 * @param windowMs Window size in milliseconds.
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs, retryAfterSec: 0 };
  }

  if (b.count >= max) {
    return {
      ok: false,
      remaining: 0,
      resetAt: b.resetAt,
      retryAfterSec: Math.ceil((b.resetAt - now) / 1000),
    };
  }

  b.count++;
  return { ok: true, remaining: max - b.count, resetAt: b.resetAt, retryAfterSec: 0 };
}

/**
 * Express/Next-style helper: returns a 429 NextResponse if the bucket is full,
 * otherwise returns null so the caller can proceed.
 *
 * Usage:
 * ```
 * const limited = checkRateLimit(`hearts:${ctx.userId}`, 20, 60 * 60 * 1000);
 * if (limited) return limited;
 * ```
 */
import { NextResponse } from 'next/server';

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): NextResponse | null {
  const r = rateLimit(key, max, windowMs);
  if (r.ok) return null;
  return NextResponse.json(
    {
      error: `Rate limit exceeded. Try again in ${r.retryAfterSec}s.`,
      code: 'RATE_LIMITED',
      retryAfterSec: r.retryAfterSec,
    },
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
