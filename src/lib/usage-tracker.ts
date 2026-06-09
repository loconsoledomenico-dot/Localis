import { kvGetJSON, kvSetJSON, _resetKvMemory } from './kv';

const LIMIT_PER_MONTH = 50;
const STORE = 'usage';

interface Counter {
  count: number;
  monthKey: string;
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if (tokenHash, slug) has remaining quota for current month, and
 * increment. Returns true if request allowed, false if quota exceeded.
 *
 * Backed by the shared KV store so the limit holds across serverless
 * instances and cold starts. Read-modify-write is not fully atomic
 * (Blobs has no INCR); acceptable at launch volume.
 */
export async function checkAndIncrement(tokenHash: string, slug: string): Promise<boolean> {
  const key = `${tokenHash}|${slug}`;
  const month = currentMonthKey();
  const entry = await kvGetJSON<Counter>(STORE, key);

  if (!entry || entry.monthKey !== month) {
    await kvSetJSON(STORE, key, { count: 1, monthKey: month });
    return true;
  }

  if (entry.count >= LIMIT_PER_MONTH) {
    return false;
  }

  await kvSetJSON(STORE, key, { count: entry.count + 1, monthKey: month });
  return true;
}

/**
 * Test-only: clear the in-memory cache.
 */
export function _resetUsageCache(): void {
  _resetKvMemory();
}
