import type { Lang } from './i18n';

/**
 * Normalize email for consistent hashing.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Source audio key for a given guide+language in R2.
 *
 * This is signed directly by /api/audio-url. A per-buyer watermarked variant
 * was previously copied here, but with no TTS prefix it was byte-identical to
 * the source and only doubled storage. Real per-buyer watermarking would
 * reintroduce a derived key at this layer.
 */
export function sourceAudioKey(slug: string, lang: Lang): string {
  return `guides/${slug}/${slug}-${lang}.mp3`;
}
