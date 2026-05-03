const LIMIT_PER_MONTH = 50;

interface Counter {
  count: number;
  monthKey: string;
}

const cache = new Map<string, Counter>();

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if (tokenHash, slug) has remaining quota for current month, and atomically increment.
 * Returns true if request allowed, false if quota exceeded.
 *
 * Phase 0: in-memory only. Cold starts reset counters (acceptable for low-volume launch).
 */
export function checkAndIncrement(tokenHash: string, slug: string): boolean {
  const key = `${tokenHash}|${slug}`;
  const month = currentMonthKey();
  const entry = cache.get(key);

  if (!entry || entry.monthKey !== month) {
    cache.set(key, { count: 1, monthKey: month });
    return true;
  }

  if (entry.count >= LIMIT_PER_MONTH) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Test-only: clear the in-memory cache.
 */
export function _resetUsageCache(): void {
  cache.clear();
}
