import { createHash } from 'node:crypto';
import { r2ObjectExists, getSignedDownloadUrl, uploadToR2 } from './r2';

/**
 * Normalize email for consistent hashing.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Compute deterministic R2 key for a buyer's watermarked variant.
 */
export function computeWatermarkKey(email: string, slug: string, lang: 'it' | 'en'): string {
  const normalized = normalizeEmail(email);
  const hash = createHash('sha256').update(`${normalized}|${slug}|${lang}`).digest('hex');
  return `wm/${hash}.mp3`;
}

/**
 * Source audio key for a given guide+language.
 */
export function sourceAudioKey(slug: string, lang: 'it' | 'en'): string {
  return `guides/${slug}/full-${lang}.mp3`;
}

/**
 * Ensure a watermarked variant exists in R2 for the given buyer.
 * Returns the R2 key of the watermarked variant.
 *
 * Phase 0: copies source audio to buyer-specific path (no TTS prefix yet).
 * Phase 1: same key, but the file at that key has TTS-generated voice prefix burned in.
 */
export async function ensureWatermarkedVariant(
  email: string,
  slug: string,
  lang: 'it' | 'en',
): Promise<string> {
  const wmKey = computeWatermarkKey(email, slug, lang);
  const srcKey = sourceAudioKey(slug, lang);

  if (await r2ObjectExists(wmKey)) {
    return wmKey;
  }

  if (!await r2ObjectExists(srcKey)) {
    throw new Error(`Source audio not found: ${srcKey}`);
  }

  const srcUrl = await getSignedDownloadUrl(srcKey, 60);
  const res = await fetch(srcUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch source audio: ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  await uploadToR2(wmKey, bytes, 'audio/mpeg');

  return wmKey;
}
