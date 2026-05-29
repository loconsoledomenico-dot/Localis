import { createHash } from 'node:crypto';

type PostHogProperties = Record<string, string | number | boolean | null | undefined>;

const POSTHOG_HOST = process.env.POSTHOG_HOST || process.env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
const POSTHOG_KEY = process.env.POSTHOG_PROJECT_API_KEY || process.env.PUBLIC_POSTHOG_KEY || '';

export function hashDistinctId(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: PostHogProperties = {},
): Promise<void> {
  if (!POSTHOG_KEY) return;

  try {
    await fetch(`${POSTHOG_HOST.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: {
          ...properties,
          source: 'server',
        },
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error(`[posthog] ${event} capture failed: ${msg}`);
  }
}
