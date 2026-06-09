import { kvGetJSON, kvSetJSON } from './kv';

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window rate limit backed by the shared KV store, so the limit holds
 * across serverless instances and cold starts (unlike a per-instance Map).
 *
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export async function rateLimit(
  bucket: string,
  id: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  const key = `${bucket}|${id}`;
  const entry = await kvGetJSON<Window>('ratelimit', key);

  if (!entry || entry.resetAt < now) {
    await kvSetJSON('ratelimit', key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  await kvSetJSON('ratelimit', key, { count: entry.count + 1, resetAt: entry.resetAt });
  return true;
}
