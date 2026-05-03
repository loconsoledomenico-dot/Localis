import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { verifyAccessToken } from '../../lib/jwt';
import { ensureWatermarkedVariant } from '../../lib/watermark';
import { getSignedDownloadUrl } from '../../lib/r2';
import { checkAndIncrement } from '../../lib/usage-tracker';

export const GET: APIRoute = async ({ url }) => {
  const guide = url.searchParams.get('guide');
  const token = url.searchParams.get('token');
  const lang = (url.searchParams.get('lang') === 'en' ? 'en' : 'it') as 'it' | 'en';

  if (!guide || !token) {
    return jsonError(400, 'Missing guide or token');
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return jsonError(401, 'Invalid token');
  }

  if (!decoded.guide_slugs.includes(guide)) {
    return jsonError(403, 'Guide not in your purchase');
  }

  // Rate limit
  const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 16);
  if (!checkAndIncrement(tokenHash, guide)) {
    return jsonError(429, 'Monthly stream limit reached. Contact hello@localis.guide if needed.');
  }

  // Generate or fetch cached watermarked variant
  let wmKey: string;
  try {
    wmKey = await ensureWatermarkedVariant(decoded.email, guide, lang);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[audio-url] watermark generation error:', msg);
    return jsonError(500, 'Audio not yet available');
  }

  // Sign URL for 1 hour
  const signedUrl = await getSignedDownloadUrl(wmKey, 3600);

  return new Response(JSON.stringify({ url: signedUrl, expires_in: 3600 }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
