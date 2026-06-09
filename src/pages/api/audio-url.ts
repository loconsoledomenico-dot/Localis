import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { verifyAccessToken } from '../../lib/jwt';
import { sourceAudioKey } from '../../lib/watermark';
import { getSignedDownloadUrl, r2ObjectExists } from '../../lib/r2';
import { checkAndIncrement } from '../../lib/usage-tracker';
import type { Lang } from '../../lib/i18n';

function normalizeLang(value: string | null): Lang {
  if (value === 'en' || value === 'de') return value;
  return 'it';
}

export const GET: APIRoute = async ({ url }) => {
  const guide = url.searchParams.get('guide');
  const token = url.searchParams.get('token');
  const lang = normalizeLang(url.searchParams.get('lang'));

  if (!guide || !token) {
    return jsonError(400, 'Missing guide or token');
  }

  const decoded = await verifyAccessToken(token);
  if (!decoded) {
    return jsonError(401, 'Invalid token');
  }

  if (!decoded.guide_slugs.includes(guide)) {
    return jsonError(403, 'Guide not in your purchase');
  }

  // Rate limit
  const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 16);
  if (!(await checkAndIncrement(tokenHash, guide))) {
    return jsonError(429, 'Monthly stream limit reached. Contact hello@localis.guide if needed.');
  }

  // Confirm the source audio exists, then sign it directly. Access control is
  // enforced by the JWT + the forced 404 on /audio/guides/* (see netlify.toml);
  // the per-buyer copy carried no watermark, so it only doubled R2 storage.
  const srcKey = sourceAudioKey(guide, lang);
  try {
    if (!(await r2ObjectExists(srcKey))) {
      return jsonError(500, 'Audio not yet available');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[audio-url] source lookup error:', msg);
    return jsonError(500, 'Audio not yet available');
  }

  // Sign URL for 1 hour
  const signedUrl = await getSignedDownloadUrl(srcKey, 3600);

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
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
