/**
 * Tiny TTL cache for expensive aggregations (analytics dashboard, reports).
 * In-memory per-process — for multi-instance, route through Redis.
 *
 *   const stats = await cached(`dash:${tenantId}`, 5 * 60_000, () => computeStats());
 *
 * Fail-open: if the compute function throws, the error propagates (we don't
 * cache errors). Cached values are returned even if stale while recompute is
 * in-flight to avoid thundering-herd on hot keys.
 */

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  compute: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = compute()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

export function invalidate(key: string) {
  store.delete(key);
}

export function invalidatePrefix(prefix: string) {
  const toDelete: string[] = [];
  store.forEach((_v, k) => {
    if (k.startsWith(prefix)) toDelete.push(k);
  });
  toDelete.forEach((k) => store.delete(k));
}
