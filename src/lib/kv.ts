/**
 * Tiny KV abstraction over Netlify Blobs with an in-memory fallback.
 *
 * Netlify Functions are ephemeral and scale to multiple concurrent
 * instances, so module-level `Map`s cannot hold shared state: counters
 * reset on every cold start and are not visible across instances. This
 * wrapper persists state in Netlify Blobs (available automatically inside
 * the Netlify runtime) and falls back to an in-memory map only when the
 * Blobs environment is absent (local `astro dev`, unit tests).
 *
 * Used for cross-instance state that must survive cold starts:
 * rate-limit counters, monthly usage counters, JWT revocation, entitlements.
 *
 * Note: Blobs has no atomic increment, so counter read-modify-write is not
 * race-free under heavy concurrency. Acceptable at launch volume; revisit
 * with Redis INCR if abuse appears.
 */
import { getStore } from '@netlify/blobs';

const memory = new Map<string, string>();

function store(name: string) {
  try {
    return getStore({ name, consistency: 'strong' });
  } catch {
    return null;
  }
}

export async function kvGet(name: string, key: string): Promise<string | null> {
  const s = store(name);
  if (s) {
    try {
      return await s.get(key, { type: 'text' });
    } catch {
      /* fall through to in-memory */
    }
  }
  return memory.get(`${name}:${key}`) ?? null;
}

export async function kvSet(name: string, key: string, value: string): Promise<void> {
  const s = store(name);
  if (s) {
    try {
      await s.set(key, value);
      return;
    } catch {
      /* fall through to in-memory */
    }
  }
  memory.set(`${name}:${key}`, value);
}

export async function kvGetJSON<T>(name: string, key: string): Promise<T | null> {
  const raw = await kvGet(name, key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSetJSON(name: string, key: string, value: unknown): Promise<void> {
  await kvSet(name, key, JSON.stringify(value));
}

/** Test-only: clear the in-memory fallback. */
export function _resetKvMemory(): void {
  memory.clear();
}
