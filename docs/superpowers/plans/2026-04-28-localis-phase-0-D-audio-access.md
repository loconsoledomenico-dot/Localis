# Milestone D — Audio access (R2 + AudioPlayer + Service Worker)

> Part of [Phase 0 master plan](2026-04-28-localis-phase-0-foundation.md). Prerequisites: A, B, C complete.

**Goal:** Replace the placeholder players on `/access/<token>` with a real, full-featured audio player. Full audio MP3s live in Cloudflare R2; signed URLs (1h expiry) are issued via `/api/audio-url`. Service Worker caches audio for offline playback after first listen. Watermarked variants are generated on demand and cached.

**Architecture:** Two R2 buckets (or two prefixes in one bucket): `guides/<slug>/full-{it,en}.mp3` for source audio (uploaded via Python script), and `wm/<sha256(email+slug)>.mp3` for buyer-personalized watermarked copies. The audio URL endpoint validates JWT, ensures watermark exists (generates if missing), and returns a signed R2 URL valid for 1 hour. AudioPlayer is a vanilla JS component (no React) registered via `<script>` block in the Astro component.

**Estimated effort:** 16-20h (12-14h tech + 4-6h content production parallel track).

**Note on content production:** This milestone splits into two parallel tracks. **Tech track** (Luigi, this plan) builds the player + R2 + watermark infrastructure. **Content track** (Domenico, parallel, see Phase 1 voice cloning task) records voice samples, sets up ElevenLabs, generates 5 final MP3s, and uploads to R2. Phase 0 launches with placeholder MP3s if content not ready (e.g. just the existing legacy bari-vecchia-v2.mp3 used everywhere). Real per-guide content arrives via Domenico's parallel work.

---

## Files

```
src/
├── lib/
│   ├── r2.ts                              # R2 S3-compatible signed URL generation
│   ├── watermark.ts                       # generates per-buyer watermarked MP3
│   └── usage-tracker.ts                   # rate limit (memory-based for Phase 0)
├── pages/
│   ├── api/
│   │   └── audio-url.ts                   # GET signed URL after JWT verify
│   └── access/
│       └── [token].astro                  # update to use AudioPlayer (replace placeholder)
├── components/
│   └── AudioPlayer.astro                  # full-featured player with chapters
public/
└── sw.js                                  # Service Worker

scripts/
├── upload-r2.py                           # upload MP3s to R2 bucket
└── pyproject.toml                         # Python deps for content scripts

tests/
└── unit/
    ├── watermark.test.ts                  # cache key generation
    └── usage-tracker.test.ts              # rate limit logic
```

---

## Task 1: Create Cloudflare R2 bucket + credentials

This is manual setup outside code. Required before any audio can be served.

- [ ] **Step 1: Open Cloudflare Dashboard**

Go to https://dash.cloudflare.com/ → R2 (left sidebar).

If R2 not enabled: click "Enable R2" → accept terms (R2 has no egress fees, generous free tier).

- [ ] **Step 2: Create bucket**

Click "Create bucket":
- Name: `localis-audio`
- Location: `Automatic` (or `Europe` for latency to Italy)
- Save

- [ ] **Step 3: Create API token (S3-compatible)**

R2 → Manage R2 API Tokens → Create API token:
- Token name: `localis-server-key`
- Permissions: `Object Read & Write`
- Bucket: `localis-audio` only
- TTL: leave default (no expiry)
- Save → copy the **Access Key ID** and **Secret Access Key** (shown ONCE).

Also note your **Account ID** (visible in R2 dashboard URL or "Account ID" sidebar).

- [ ] **Step 4: Add R2 env vars**

Add to `.env.local`:

```
R2_ACCOUNT_ID=<your-account-id>
R2_ACCESS_KEY=<your-access-key-id>
R2_SECRET_KEY=<your-secret-access-key>
R2_BUCKET=localis-audio
R2_PUBLIC_URL=
```

(Leave `R2_PUBLIC_URL` empty for now — the audio URL endpoint generates signed URLs, not public ones.)

Add same vars to Netlify env dashboard (server-side, NOT prefixed `PUBLIC_`).

- [ ] **Step 5: Optional — connect custom domain (Phase 1)**

For Phase 0, R2 default URLs (`https://<account-id>.r2.cloudflarestorage.com/localis-audio/...`) are fine. Phase 1 may add custom domain `audio.localis.guide` for cleaner URLs and CDN caching benefits.

---

## Task 2: Build R2 signed URL helper

**Files:**
- Create: `src/lib/r2.ts`

- [ ] **Step 1: Install AWS SDK v3 (S3-compatible client)**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- [ ] **Step 2: Create r2.ts**

Write to `src/lib/r2.ts`:

```typescript
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;
  if (!accountId || !accessKey || !secretKey) {
    throw new Error('R2 credentials not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY)');
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
  return _client;
}

function bucket(): string {
  return process.env.R2_BUCKET || 'localis-audio';
}

/**
 * Generate a signed URL for downloading an R2 object.
 * @param key Object key (e.g. "guides/bari-vecchia/full-it.mp3")
 * @param expiresInSeconds Seconds until URL expiry (default 3600 = 1h)
 */
export async function getSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(getClient(), cmd, { expiresIn: expiresInSeconds });
}

/**
 * Check whether an object exists in R2.
 */
export async function r2ObjectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (err: unknown) {
    const code = (err as { name?: string }).name;
    if (code === 'NotFound' || code === 'NoSuchKey') return false;
    throw err;
  }
}

/**
 * Upload bytes to R2.
 */
export async function uploadToR2(key: string, body: Uint8Array | Buffer | string, contentType: string): Promise<void> {
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await getClient().send(cmd);
}
```

- [ ] **Step 3: Quick smoke test (manual)**

Create a temporary script `tests/smoke/r2-smoke.ts`:

```typescript
import { uploadToR2, getSignedDownloadUrl, r2ObjectExists } from '../../src/lib/r2';

async function main() {
  const key = `test/smoke-${Date.now()}.txt`;
  await uploadToR2(key, 'hello from localis r2 smoke', 'text/plain');
  console.log('Upload OK');
  const exists = await r2ObjectExists(key);
  console.log('Exists:', exists);
  const url = await getSignedDownloadUrl(key, 60);
  console.log('Signed URL:', url);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run:

```bash
pnpm tsx tests/smoke/r2-smoke.ts
```

(Install `tsx` if missing: `pnpm add -D tsx`.)

Expected output: "Upload OK", "Exists: true", and a long URL. Open the URL in browser → should download/show "hello from localis r2 smoke".

If error: check R2 credentials, account ID, bucket name.

- [ ] **Step 4: Delete smoke file**

```bash
rm tests/smoke/r2-smoke.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/r2.ts package.json pnpm-lock.yaml
git commit -m "feat: add R2 S3-compatible client wrapper for signed URLs and uploads"
```

---

## Task 3: Build watermark generation module

**Files:**
- Create: `src/lib/watermark.ts`, `tests/unit/watermark.test.ts`

For Phase 0, we use a simplified watermark: instead of generating a per-buyer audio prefix via TTS (which requires ElevenLabs Creator subscription, set up in Phase 1), we serve the raw audio with a watermark cache key based on email+slug. The actual TTS-prefixed audio generation is implemented in Phase 1 voice cloning task. For Phase 0, the watermark module just builds the cache key and copies the source MP3 to a per-buyer R2 path.

This still gives us the legal benefit (per-buyer audio path = traceability) without needing ElevenLabs day 1. Phase 1 upgrades this to actual voice prefixing.

- [ ] **Step 1: Install crypto (built-in Node, no install needed)**

- [ ] **Step 2: Write watermark test**

Create `tests/unit/watermark.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeWatermarkKey, normalizeEmail } from '../../src/lib/watermark';

describe('watermark module', () => {
  describe('normalizeEmail', () => {
    it('lowercases and trims', () => {
      expect(normalizeEmail('  Buyer@Example.COM  ')).toBe('buyer@example.com');
    });
  });

  describe('computeWatermarkKey', () => {
    it('produces a deterministic R2 key for (email, slug, lang) tuple', () => {
      const a = computeWatermarkKey('buyer@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('buyer@test.com', 'bari-vecchia', 'it');
      expect(a).toBe(b);
    });

    it('produces different keys for different emails', () => {
      const a = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('b@test.com', 'bari-vecchia', 'it');
      expect(a).not.toBe(b);
    });

    it('produces different keys for different slugs', () => {
      const a = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('a@test.com', 'porto-bari', 'it');
      expect(a).not.toBe(b);
    });

    it('produces different keys for different languages', () => {
      const a = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      const b = computeWatermarkKey('a@test.com', 'bari-vecchia', 'en');
      expect(a).not.toBe(b);
    });

    it('returns key with wm/ prefix and .mp3 suffix', () => {
      const key = computeWatermarkKey('a@test.com', 'bari-vecchia', 'it');
      expect(key.startsWith('wm/')).toBe(true);
      expect(key.endsWith('.mp3')).toBe(true);
    });

    it('is case-insensitive on email', () => {
      const a = computeWatermarkKey('Buyer@Test.COM', 'x', 'it');
      const b = computeWatermarkKey('buyer@test.com', 'x', 'it');
      expect(a).toBe(b);
    });
  });
});
```

- [ ] **Step 3: Run test → expect fail**

```bash
pnpm test
```

Expected FAIL: cannot find module.

- [ ] **Step 4: Write watermark.ts**

Write to `src/lib/watermark.ts`:

```typescript
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
 * Same (email, slug, lang) → same key, so we cache one variant per buyer.
 *
 * Phase 0: this key points to a copy of the source audio under a buyer-traceable path.
 * Phase 1: same key, but the file at that key has TTS-generated voice prefix burned in.
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
 * Phase 0 implementation: copies source audio to buyer-specific path.
 * Phase 1 will replace the body of this function with ElevenLabs-prefixed variant generation.
 */
export async function ensureWatermarkedVariant(
  email: string,
  slug: string,
  lang: 'it' | 'en',
): Promise<string> {
  const wmKey = computeWatermarkKey(email, slug, lang);
  const srcKey = sourceAudioKey(slug, lang);

  // Check if watermark already exists (cache hit)
  if (await r2ObjectExists(wmKey)) {
    return wmKey;
  }

  // Source must exist
  if (!await r2ObjectExists(srcKey)) {
    throw new Error(`Source audio not found: ${srcKey}`);
  }

  // Phase 0: copy source to buyer path (no TTS prefix yet).
  // We download source bytes via signed URL, then upload to wm/ path.
  const srcUrl = await getSignedDownloadUrl(srcKey, 60);
  const res = await fetch(srcUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch source audio: ${res.status}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  await uploadToR2(wmKey, bytes, 'audio/mpeg');

  return wmKey;
}
```

- [ ] **Step 5: Run test → expect pass**

```bash
pnpm test
```

All 6 watermark tests should PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/watermark.ts tests/unit/watermark.test.ts
git commit -m "feat: add watermark module with deterministic per-buyer R2 key generation"
```

---

## Task 4: Build usage tracker (rate limit)

**Files:**
- Create: `src/lib/usage-tracker.ts`, `tests/unit/usage-tracker.test.ts`

Phase 0 uses in-memory counters. Acceptable since Netlify Functions cold-start frequently; one cold start = counter reset = lenient enforcement. Phase 1 may upgrade to Redis/Turso for accurate per-month tracking.

- [ ] **Step 1: Write usage tracker test**

Write to `tests/unit/usage-tracker.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndIncrement, _resetUsageCache } from '../../src/lib/usage-tracker';

describe('usage tracker', () => {
  beforeEach(() => {
    _resetUsageCache();
  });

  it('allows up to monthly limit', () => {
    const tokenHash = 'token-abc';
    const slug = 'bari-vecchia';
    for (let i = 0; i < 50; i++) {
      expect(checkAndIncrement(tokenHash, slug)).toBe(true);
    }
  });

  it('rejects on the 51st request', () => {
    const tokenHash = 'token-abc';
    const slug = 'bari-vecchia';
    for (let i = 0; i < 50; i++) {
      checkAndIncrement(tokenHash, slug);
    }
    expect(checkAndIncrement(tokenHash, slug)).toBe(false);
  });

  it('tracks separately per (token, slug)', () => {
    const t = 'token-x';
    for (let i = 0; i < 50; i++) {
      checkAndIncrement(t, 'bari-vecchia');
    }
    expect(checkAndIncrement(t, 'porto-bari')).toBe(true);
    expect(checkAndIncrement(t, 'bari-vecchia')).toBe(false);
  });

  it('tracks separately per token', () => {
    for (let i = 0; i < 50; i++) {
      checkAndIncrement('token-a', 'bari-vecchia');
    }
    expect(checkAndIncrement('token-b', 'bari-vecchia')).toBe(true);
  });
});
```

- [ ] **Step 2: Write usage-tracker.ts**

Write to `src/lib/usage-tracker.ts`:

```typescript
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
 * Phase 1+: backed by persistent store (Turso/Redis) for accurate enforcement.
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
```

- [ ] **Step 3: Run tests → expect pass**

```bash
pnpm test
```

All 4 usage tracker tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/usage-tracker.ts tests/unit/usage-tracker.test.ts
git commit -m "feat: add in-memory monthly usage tracker (50 streams/token/guide)"
```

---

## Task 5: Build /api/audio-url endpoint

**Files:**
- Create: `src/pages/api/audio-url.ts`

- [ ] **Step 1: Write endpoint**

Write to `src/pages/api/audio-url.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/api/audio-url.ts
git commit -m "feat: add /api/audio-url endpoint with JWT verify, rate limit, watermark, signed URL"
```

---

## Task 6: Upload placeholder audio to R2

**Files:**
- Create: `scripts/upload-r2.py`, `scripts/pyproject.toml`

For Phase 0 launch, until Domenico's voice cloning is done in parallel content track, we upload the existing legacy audio files as placeholders. This unblocks the player to render and play real audio end-to-end.

- [ ] **Step 1: Create scripts/pyproject.toml**

Write to `scripts/pyproject.toml`:

```toml
[project]
name = "localis-scripts"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "boto3>=1.35.0",
    "python-dotenv>=1.0.0",
]
```

- [ ] **Step 2: Create upload script**

Write to `scripts/upload-r2.py`:

```python
"""
Upload audio files to Cloudflare R2.

Usage:
  python scripts/upload-r2.py <local-path> <r2-key>

Examples:
  python scripts/upload-r2.py audio/bari-vecchia-it.mp3 guides/bari-vecchia/full-it.mp3
  python scripts/upload-r2.py audio/bari-vecchia-en.mp3 guides/bari-vecchia/full-en.mp3
"""
import os
import sys
from pathlib import Path

import boto3
from dotenv import load_dotenv

# Load env from project root .env.local
ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / '.env.local')

R2_ACCOUNT_ID = os.environ['R2_ACCOUNT_ID']
R2_ACCESS_KEY = os.environ['R2_ACCESS_KEY']
R2_SECRET_KEY = os.environ['R2_SECRET_KEY']
R2_BUCKET = os.environ.get('R2_BUCKET', 'localis-audio')


def upload(local_path: Path, key: str) -> None:
    s3 = boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    )

    print(f'Uploading {local_path} → r2://{R2_BUCKET}/{key} ...')
    s3.upload_file(
        str(local_path),
        R2_BUCKET,
        key,
        ExtraArgs={'ContentType': 'audio/mpeg'},
    )
    print('  ✓ Done')


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    local_path = Path(sys.argv[1])
    key = sys.argv[2]
    if not local_path.exists():
        print(f'Local file not found: {local_path}')
        return 1
    upload(local_path, key)
    return 0


if __name__ == '__main__':
    sys.exit(main())
```

- [ ] **Step 3: Install Python deps**

```bash
cd scripts
python -m pip install boto3 python-dotenv
cd ..
```

(Or use a venv if preferred: `python -m venv scripts/.venv && scripts/.venv/Scripts/activate && pip install ...`)

- [ ] **Step 4: Upload placeholders**

We have 3 legacy MP3s downloaded in earlier sessions: `bari-vecchia-v2.mp3` (~7MB), `porto-bari.mp3` (~7MB), `san_nicola_audio_completo.mp3` (~4MB). These are gone now (deleted in Milestone B Task 1) — but we can re-download them from the legacy Netlify deploy if needed.

For now, **upload the same trailer.mp3 as a placeholder for all guides + both languages**. This keeps the player demo-able. Real audio replaces these in Phase 1 content track.

```bash
# IT placeholders
python scripts/upload-r2.py public/audio/trailers/bari-vecchia.mp3 guides/bari-vecchia/full-it.mp3
python scripts/upload-r2.py public/audio/trailers/porto-bari.mp3 guides/porto-bari/full-it.mp3
python scripts/upload-r2.py public/audio/trailers/san-nicola.mp3 guides/san-nicola/full-it.mp3
python scripts/upload-r2.py public/audio/trailers/il-meglio-di-bari.mp3 guides/il-meglio-di-bari/full-it.mp3

# EN placeholders (same files for now)
python scripts/upload-r2.py public/audio/trailers/bari-vecchia.mp3 guides/bari-vecchia/full-en.mp3
python scripts/upload-r2.py public/audio/trailers/porto-bari.mp3 guides/porto-bari/full-en.mp3
python scripts/upload-r2.py public/audio/trailers/san-nicola.mp3 guides/san-nicola/full-en.mp3
python scripts/upload-r2.py public/audio/trailers/il-meglio-di-bari.mp3 guides/il-meglio-di-bari/full-en.mp3
```

After upload, verify in Cloudflare R2 dashboard → Bucket `localis-audio` → 8 files at `guides/<slug>/full-{it,en}.mp3`.

- [ ] **Step 5: Commit script**

```bash
git add scripts/pyproject.toml scripts/upload-r2.py
git commit -m "feat: add Python R2 upload script for content production pipeline"
```

---

## Task 7: Build AudioPlayer component

**Files:**
- Create: `src/components/AudioPlayer.astro`

- [ ] **Step 1: Create AudioPlayer**

Write to `src/components/AudioPlayer.astro`:

```astro
---
import type { CollectionEntry } from 'astro:content';
import { formatDuration } from '../lib/format';
import type { Lang } from '../lib/i18n';

export interface Props {
  guide: CollectionEntry<'guides'>['data'];
  token: string;
  lang: Lang;
}

const { guide, token, lang } = Astro.props;

const labels = {
  it: {
    play: 'Riproduci',
    pause: 'Pausa',
    rewind: 'Indietro 15 secondi',
    forward: 'Avanti 15 secondi',
    speed: 'Velocità',
    chapters: 'Capitoli',
    loading: 'Caricamento...',
    offline_ready: 'Disponibile offline ✓',
    offline_caching: 'Salvataggio per offline...',
    error: 'Impossibile caricare l\'audio.',
    retry: 'Riprova',
  },
  en: {
    play: 'Play',
    pause: 'Pause',
    rewind: 'Back 15 seconds',
    forward: 'Forward 15 seconds',
    speed: 'Speed',
    chapters: 'Chapters',
    loading: 'Loading...',
    offline_ready: 'Available offline ✓',
    offline_caching: 'Saving for offline...',
    error: 'Could not load audio.',
    retry: 'Retry',
  },
}[lang];
---
<div
  class="audio-player border border-border rounded-lg bg-surface-elev overflow-hidden"
  data-guide-slug={guide.slug}
  data-token={token}
  data-lang={lang}
  data-duration={guide.duration_seconds}
>
  <div class="p-md flex items-center gap-md">
    <!-- Play/Pause -->
    <button
      type="button"
      class="ap-toggle flex-shrink-0 w-14 h-14 rounded-full bg-ink text-surface flex items-center justify-center transition-transform duration-fast hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
      aria-label={labels.play}
    >
      <svg class="ap-icon-play" width="16" height="18" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true">
        <path d="M0 0l10 6-10 6z" />
      </svg>
      <svg class="ap-icon-pause hidden" width="16" height="18" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
        <path d="M2 0h3v14H2zM7 0h3v14H7z" />
      </svg>
      <svg class="ap-icon-loading hidden animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.3" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke-linecap="round" />
      </svg>
    </button>

    <!-- Skip back -->
    <button type="button" class="ap-rewind text-ink-muted hover:text-ink transition-colors duration-fast" aria-label={labels.rewind}>
      ⏪
    </button>

    <!-- Progress -->
    <div class="flex-1 min-w-0">
      <div class="ap-progress h-1 bg-ink/10 rounded-full overflow-hidden cursor-pointer" role="progressbar" aria-label="Audio progress" tabindex="0">
        <div class="ap-fill h-full bg-accent rounded-full" style="width: 0%"></div>
      </div>
      <div class="flex justify-between mt-xs text-xs text-ink-subtle font-mono tabular-nums">
        <span class="ap-current">0:00</span>
        <span class="ap-duration">{formatDuration(guide.duration_seconds, 'long')}</span>
      </div>
    </div>

    <!-- Skip forward -->
    <button type="button" class="ap-forward text-ink-muted hover:text-ink transition-colors duration-fast" aria-label={labels.forward}>
      ⏩
    </button>

    <!-- Speed -->
    <button type="button" class="ap-speed text-xs font-semibold text-ink-muted hover:text-ink transition-colors duration-fast min-w-10" data-speed="1" aria-label={labels.speed}>
      1×
    </button>
  </div>

  <!-- Chapters -->
  <details class="border-t border-border">
    <summary class="px-md py-sm cursor-pointer text-sm font-semibold text-ink-muted hover:text-ink select-none">
      {labels.chapters} ({guide.chapters.length})
    </summary>
    <ol class="px-md pb-md flex flex-col gap-2xs">
      {guide.chapters.map((ch, i) => {
        const title = lang === 'it' ? ch.title_it : ch.title_en;
        return (
          <li>
            <button
              type="button"
              class="ap-chapter w-full text-left flex items-baseline gap-sm py-xs hover:bg-surface rounded-sm transition-colors duration-fast"
              data-time={ch.start_seconds}
            >
              <span class="font-mono text-xs text-ink-subtle tabular-nums w-6">{String(i + 1).padStart(2, '0')}</span>
              <span class="flex-1 text-sm text-ink">{title}</span>
              <span class="font-mono text-xs text-ink-subtle tabular-nums">{formatDuration(ch.start_seconds, 'long')}</span>
            </button>
          </li>
        );
      })}
    </ol>
  </details>

  <!-- Status (offline/caching) -->
  <div class="ap-status px-md py-xs border-t border-border text-xs text-ink-subtle hidden">
    <span class="ap-status-text"></span>
  </div>

  <!-- Error -->
  <div class="ap-error px-md py-md border-t border-error/30 bg-error/5 text-sm text-error hidden">
    <p class="ap-error-text">{labels.error}</p>
    <button type="button" class="ap-retry mt-xs underline">{labels.retry}</button>
  </div>

  <audio class="ap-audio" preload="none" crossorigin="anonymous"></audio>
</div>

<script>
  type Player = {
    el: HTMLElement;
    audio: HTMLAudioElement;
    toggle: HTMLButtonElement;
    iconPlay: SVGElement;
    iconPause: SVGElement;
    iconLoading: SVGElement;
    rewind: HTMLButtonElement;
    forward: HTMLButtonElement;
    speed: HTMLButtonElement;
    progress: HTMLElement;
    fill: HTMLElement;
    cur: HTMLElement;
    dur: HTMLElement;
    chapters: NodeListOf<HTMLButtonElement>;
    status: HTMLElement;
    statusText: HTMLElement;
    error: HTMLElement;
    retry: HTMLButtonElement;
    slug: string;
    token: string;
    lang: 'it' | 'en';
    audioUrl?: string;
  };

  const SPEEDS = [1, 1.25, 1.5, 2, 0.85];

  function fmtTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  async function fetchAudioUrl(slug: string, token: string, lang: 'it' | 'en'): Promise<string> {
    const res = await fetch(`/api/audio-url?guide=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}&lang=${lang}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.url;
  }

  function showStatus(p: Player, text: string): void {
    p.status.classList.remove('hidden');
    p.statusText.textContent = text;
  }

  function hideStatus(p: Player): void {
    p.status.classList.add('hidden');
  }

  function showError(p: Player, text?: string): void {
    p.error.classList.remove('hidden');
    if (text) p.el.querySelector<HTMLElement>('.ap-error-text')!.textContent = text;
    p.iconLoading.classList.add('hidden');
    p.iconPlay.classList.remove('hidden');
    p.toggle.disabled = false;
  }

  function hideError(p: Player): void {
    p.error.classList.add('hidden');
  }

  function setPlayingState(p: Player, playing: boolean, loading = false): void {
    p.iconPlay.classList.toggle('hidden', playing || loading);
    p.iconPause.classList.toggle('hidden', !playing || loading);
    p.iconLoading.classList.toggle('hidden', !loading);
    p.toggle.disabled = loading;
  }

  async function play(p: Player): Promise<void> {
    if (!p.audioUrl) {
      setPlayingState(p, false, true);
      try {
        p.audioUrl = await fetchAudioUrl(p.slug, p.token, p.lang);
        p.audio.src = p.audioUrl;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'unknown';
        showError(p, msg);
        return;
      }
    }
    try {
      await p.audio.play();
      setPlayingState(p, true);
      // Trigger Service Worker pre-cache
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PRECACHE_AUDIO',
          url: p.audioUrl,
          guide: p.slug,
        });
        showStatus(p, p.el.dataset.lang === 'en' ? 'Saving for offline...' : 'Salvataggio per offline...');
      }
    } catch (err) {
      showError(p);
    }
  }

  function pause(p: Player): void {
    p.audio.pause();
    setPlayingState(p, false);
  }

  function initPlayer(el: HTMLElement): void {
    const p: Player = {
      el,
      audio: el.querySelector<HTMLAudioElement>('.ap-audio')!,
      toggle: el.querySelector<HTMLButtonElement>('.ap-toggle')!,
      iconPlay: el.querySelector<SVGElement>('.ap-icon-play')!,
      iconPause: el.querySelector<SVGElement>('.ap-icon-pause')!,
      iconLoading: el.querySelector<SVGElement>('.ap-icon-loading')!,
      rewind: el.querySelector<HTMLButtonElement>('.ap-rewind')!,
      forward: el.querySelector<HTMLButtonElement>('.ap-forward')!,
      speed: el.querySelector<HTMLButtonElement>('.ap-speed')!,
      progress: el.querySelector<HTMLElement>('.ap-progress')!,
      fill: el.querySelector<HTMLElement>('.ap-fill')!,
      cur: el.querySelector<HTMLElement>('.ap-current')!,
      dur: el.querySelector<HTMLElement>('.ap-duration')!,
      chapters: el.querySelectorAll<HTMLButtonElement>('.ap-chapter'),
      status: el.querySelector<HTMLElement>('.ap-status')!,
      statusText: el.querySelector<HTMLElement>('.ap-status-text')!,
      error: el.querySelector<HTMLElement>('.ap-error')!,
      retry: el.querySelector<HTMLButtonElement>('.ap-retry')!,
      slug: el.dataset.guideSlug!,
      token: el.dataset.token!,
      lang: (el.dataset.lang === 'en' ? 'en' : 'it') as 'it' | 'en',
    };

    p.audio.addEventListener('loadedmetadata', () => {
      p.dur.textContent = fmtTime(p.audio.duration);
    });

    p.audio.addEventListener('timeupdate', () => {
      if (!p.audio.duration) return;
      const pct = (p.audio.currentTime / p.audio.duration) * 100;
      p.fill.style.width = `${pct}%`;
      p.cur.textContent = fmtTime(p.audio.currentTime);
    });

    p.audio.addEventListener('ended', () => setPlayingState(p, false));
    p.audio.addEventListener('canplaythrough', () => {
      hideStatus(p);
      showStatus(p, p.lang === 'en' ? 'Available offline ✓' : 'Disponibile offline ✓');
      setTimeout(() => hideStatus(p), 3000);
    });
    p.audio.addEventListener('error', () => showError(p));

    p.toggle.addEventListener('click', () => {
      hideError(p);
      if (p.audio.paused) play(p);
      else pause(p);
    });

    p.retry.addEventListener('click', () => {
      hideError(p);
      delete p.audioUrl;
      p.audio.removeAttribute('src');
      play(p);
    });

    p.rewind.addEventListener('click', () => {
      p.audio.currentTime = Math.max(0, p.audio.currentTime - 15);
    });

    p.forward.addEventListener('click', () => {
      p.audio.currentTime = Math.min(p.audio.duration || 0, p.audio.currentTime + 15);
    });

    p.speed.addEventListener('click', () => {
      const cur = parseFloat(p.speed.dataset.speed || '1');
      const idx = SPEEDS.indexOf(cur);
      const next = SPEEDS[(idx + 1) % SPEEDS.length];
      p.audio.playbackRate = next;
      p.speed.dataset.speed = String(next);
      p.speed.textContent = `${next}×`;
    });

    p.progress.addEventListener('click', (e) => {
      if (!p.audio.duration) return;
      const r = p.progress.getBoundingClientRect();
      p.audio.currentTime = ((e.clientX - r.left) / r.width) * p.audio.duration;
    });

    p.progress.addEventListener('keydown', (e) => {
      if (!p.audio.duration) return;
      if (e.key === 'ArrowRight') {
        p.audio.currentTime = Math.min(p.audio.duration, p.audio.currentTime + 15);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        p.audio.currentTime = Math.max(0, p.audio.currentTime - 15);
        e.preventDefault();
      }
    });

    p.chapters.forEach((ch) => {
      ch.addEventListener('click', () => {
        const time = parseFloat(ch.dataset.time || '0');
        if (!p.audio.src) {
          play(p).then(() => {
            const onCanPlay = () => {
              p.audio.currentTime = time;
              p.audio.removeEventListener('canplay', onCanPlay);
            };
            p.audio.addEventListener('canplay', onCanPlay);
          });
        } else {
          p.audio.currentTime = time;
        }
      });
    });
  }

  document.querySelectorAll<HTMLElement>('.audio-player').forEach(initPlayer);
</script>
```

- [ ] **Step 2: Commit AudioPlayer**

```bash
git add src/components/AudioPlayer.astro
git commit -m "feat: add AudioPlayer component with chapters, speed, keyboard nav, error/loading states"
```

---

## Task 8: Wire AudioPlayer into /access/[token]

**Files:**
- Modify: `src/pages/access/[token].astro`

- [ ] **Step 1: Replace placeholder with real AudioPlayer**

Replace `src/pages/access/[token].astro` contents with:

```astro
---
import Layout from '../../components/Layout.astro';
import Eyebrow from '../../components/Eyebrow.astro';
import AudioPlayer from '../../components/AudioPlayer.astro';
import { verifyAccessToken } from '../../lib/jwt';
import { getCollection } from 'astro:content';

const { token } = Astro.params;

if (!token) {
  return Astro.redirect('/access-invalid');
}

const decoded = verifyAccessToken(token);

if (!decoded) {
  return Astro.redirect('/access-invalid');
}

const allGuides = await getCollection('guides');
const userGuides = decoded.guide_slugs
  .map((slug) => allGuides.find((g) => g.data.slug === slug))
  .filter((g): g is NonNullable<typeof g> => Boolean(g));

const lang: 'it' | 'en' = 'it';
---
<Layout title="Le tue guide · Localis" description="" lang={lang}>
  <main class="max-w-wrap mx-auto px-md py-2xl">
    <header class="mb-2xl">
      <Eyebrow class="mb-md">Accesso permanente · {decoded.email}</Eyebrow>
      <h1 class="font-display text-4xl text-ink mb-md">Le tue guide</h1>
      <p class="text-base text-ink-muted max-w-prose">
        Salva questa pagina nei preferiti — è solo tua, vale per sempre.
        Funziona offline dopo il primo play su ogni dispositivo.
      </p>
    </header>

    <div class="flex flex-col gap-2xl">
      {userGuides.map((guide) => (
        <section>
          <h2 class="font-display text-2xl text-ink mb-xs">{guide.data.title_it}</h2>
          <p class="text-sm text-ink-muted mb-md">{guide.data.subtitle_it}</p>
          <AudioPlayer guide={guide.data} token={token} lang={lang} />
        </section>
      ))}
    </div>

    <footer class="mt-3xl pt-lg border-t border-border text-center">
      <p class="text-sm text-ink-muted mb-xs">
        Cambiato telefono? Riapri questo link.
      </p>
      <p class="text-sm text-ink-muted">
        Smarrita email? <a href="/recover" class="text-link hover:text-link-hover">Recupera l'accesso</a>.
      </p>
    </footer>
  </main>

  <script is:inline>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  </script>
</Layout>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/access/[token].astro
git commit -m "feat: wire AudioPlayer into /access page; register Service Worker"
```

---

## Task 9: Implement Service Worker

**Files:**
- Create: `public/sw.js`

- [ ] **Step 1: Write Service Worker**

Write to `public/sw.js`:

```javascript
const CACHE_VERSION = 'v1';
const AUDIO_CACHE = `localis-audio-${CACHE_VERSION}`;
const STATIC_CACHE = `localis-static-${CACHE_VERSION}`;

// Cache shell on install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([
        '/',
        '/offline.html',
        '/favicon.svg',
      ]).catch(() => {}),
    ),
  );
});

// Cleanup old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== AUDIO_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // R2 audio (cache-first, offline-ready after first download)
  if (url.hostname.endsWith('.r2.cloudflarestorage.com')) {
    event.respondWith(handleAudio(event.request));
    return;
  }

  // Trailers (also cache-first, public assets)
  if (url.pathname.startsWith('/audio/trailers/')) {
    event.respondWith(handleAudio(event.request));
    return;
  }

  // HTML navigation: network-first, fallback to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.svg') {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(event.request, clone));
          }
          return response;
        }),
      ),
    );
    return;
  }
  // default: pass-through
});

async function handleAudio(request) {
  // Strip query params (signed URLs change per request) for cache key
  const url = new URL(request.url);
  const cacheKey = `${url.origin}${url.pathname}`;
  const cacheKeyRequest = new Request(cacheKey);

  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(cacheKeyRequest);
  if (cached) {
    return cached;
  }

  // Network fetch
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      // Only cache full 200 responses (not 206 partial)
      const clone = response.clone();
      cache.put(cacheKeyRequest, clone).catch(() => {});
    }
    return response;
  } catch (err) {
    // Try cache match again (might have just been written)
    const fallback = await cache.match(cacheKeyRequest);
    if (fallback) return fallback;
    throw err;
  }
}

// Pre-cache audio on demand
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PRECACHE_AUDIO' && event.data.url) {
    caches.open(AUDIO_CACHE).then(async (cache) => {
      try {
        const response = await fetch(event.data.url);
        if (response.ok) {
          const url = new URL(event.data.url);
          const cacheKey = new Request(`${url.origin}${url.pathname}`);
          await cache.put(cacheKey, response);
        }
      } catch {
        // ignore
      }
    });
  }
});
```

- [ ] **Step 2: Add offline page**

Write to `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Offline · Localis</title>
<style>
  body {
    background: #FAF7F2;
    color: #1C1510;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .box { max-width: 480px; text-align: center; }
  h1 {
    font-family: Georgia, serif;
    font-weight: 400;
    font-size: 2rem;
    margin: 0 0 16px;
  }
  p { color: #5A6477; line-height: 1.6; }
</style>
</head>
<body>
  <div class="box">
    <h1>Sei offline.</h1>
    <p>Le guide già aperte funzionano da cache. Riprova quando sei in connessione.</p>
  </div>
</body>
</html>
```

- [ ] **Step 3: Verify Service Worker registers**

```bash
pnpm build && pnpm preview
```

Open http://localhost:4321/access/<some-valid-token> in Chrome. DevTools → Application → Service Workers. Should show `/sw.js` registered, status "activated and is running".

DevTools → Network → reload page → audio request from `r2.cloudflarestorage.com` → check headers (should be 200 first time, served from `(ServiceWorker)` on second play).

- [ ] **Step 4: Commit Service Worker**

```bash
git add public/sw.js public/offline.html
git commit -m "feat: add Service Worker with audio cache-first, HTML network-first, offline fallback"
```

---

## Task 10: Final Milestone D verification + tag

- [ ] **Step 1: End-to-end test**

```bash
pnpm dev
```

1. Buy a guide (Stripe test card).
2. Open access link from email.
3. Click play → audio plays.
4. Refresh page → still loads (HTML network-first).
5. Toggle airplane mode → click play again on same guide → still plays from cache.
6. Click chapter → seeks correctly.
7. Speed button cycles 1× → 1.25× → 1.5× → 2× → 0.85× → 1×.

- [ ] **Step 2: Quality gate**

```bash
pnpm check && pnpm test && pnpm test:e2e && pnpm build
```

- [ ] **Step 3: Tag**

```bash
git tag phase-0-D-complete
git push origin phase-0-D-complete
```

- [ ] **Step 4: Update master plan**

Mark Milestone D complete; commit + push.

---

## Milestone D exit criteria

- [ ] ✅ Cloudflare R2 bucket `localis-audio` created with API credentials
- [ ] ✅ R2 helper module with signed URL + exists check + upload
- [ ] ✅ Watermark module with deterministic per-buyer key
- [ ] ✅ Usage tracker enforces 50 streams/month/(token,guide)
- [ ] ✅ `/api/audio-url` validates JWT, rate-limits, returns 1h signed R2 URL
- [ ] ✅ Python `upload-r2.py` script for content production
- [ ] ✅ AudioPlayer component with chapters, speed, keyboard nav, error/loading states
- [ ] ✅ Service Worker caches audio (cache-first), HTML (network-first), offline fallback
- [ ] ✅ End-to-end: purchase → email → access → play → cache → offline play works
- [ ] ✅ All tests pass
- [ ] ✅ Tag `phase-0-D-complete` pushed

---

➡️ **Next: [Milestone E — Partner system](2026-04-28-localis-phase-0-E-partner-system.md)** (cookie attribution, Stripe Connect onboarding, transfer_data split, partner landings)
