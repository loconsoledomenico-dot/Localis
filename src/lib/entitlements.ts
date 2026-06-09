import { createHash } from 'node:crypto';
import { kvGetJSON, kvSetJSON } from './kv';

const STORE = 'entitlements';

export interface Entitlement {
  guide_slugs: string[];
  partner_id: string | null;
  last_session_id: string;
  updated_at: string;
}

function emailKey(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

/**
 * Record (or extend) a buyer's purchased guides, keyed by email.
 * Merges with any existing entitlement so multiple purchases accumulate.
 * Idempotent — safe to call on Stripe webhook retries.
 */
export async function grantEntitlement(
  email: string,
  guideSlugs: string[],
  partnerId: string | null,
  sessionId: string,
): Promise<void> {
  const key = emailKey(email);
  const existing = await kvGetJSON<Entitlement>(STORE, key);
  const merged = new Set([...(existing?.guide_slugs ?? []), ...guideSlugs]);

  await kvSetJSON(STORE, key, {
    guide_slugs: [...merged],
    partner_id: partnerId ?? existing?.partner_id ?? null,
    last_session_id: sessionId,
    updated_at: new Date().toISOString(),
  } satisfies Entitlement);
}

/**
 * Look up a buyer's entitlement by email. Single indexed read — no Stripe scan.
 */
export async function getEntitlement(email: string): Promise<Entitlement | null> {
  return kvGetJSON<Entitlement>(STORE, emailKey(email));
}
