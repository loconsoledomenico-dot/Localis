/**
 * generate-og.mjs
 *
 * Genera OG image 1200×630 per ogni guida Localis.
 * Output: public/og/og-[slug].jpg
 *
 * Uso:
 *   node scripts/generate-og.mjs
 *   oppure: npm run og (se aggiunto in package.json)
 *
 * Dipendenze: sharp (già installata come dep Astro)
 */

import sharp from 'sharp';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT   = resolve(fileURLToPath(import.meta.url), '..', '..');
const GUIDES = join(ROOT, 'src', 'content', 'guides');
const PUBLIC = join(ROOT, 'public');
const OUT    = join(PUBLIC, 'og');

// ─── Palette (hex → RGB) ──────────────────────────────────────────────────────
// ─── Dimensioni ───────────────────────────────────────────────────────────────
const W = 1200;
const H = 630;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Legge slug + campi rilevanti dal frontmatter YAML di ogni .mdx */
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const block = m[1];

  const get = (key) => {
    const r = block.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, 'm'));
    return r ? r[1].trim() : null;
  };

  const slug       = get('slug');
  const cover      = get('cover');          // es. /images/covers/bari-vecchia.jpg
  const title_it   = get('title_it');
  const chapters   = (block.match(/^  - /gm) || []).length;  // conta capitoli

  return slug && cover && title_it ? { slug, cover, title_it, chapters } : null;
}

/** Tronca titolo se supera maxLen caratteri */
function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + '…';
}

/** Encode sicuro per SVG text */
function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Genera l'SVG overlay con:
 * - gradiente scuro a sinistra per leggibilità
 * - numero capitoli (in alto a sinistra)
 * - titolo guida (grande, centrale-sinistra)
 * - "Localis" logo (in basso a sinistra)
 * - linea accent sotto il titolo
 */
function buildOverlaySvg(title_it, chapters) {
  const title      = esc(truncate(title_it, 42));
  const chapLabel  = esc(`${chapters} capitoli`);
  const logoText   = 'Localis';

  // Divide il titolo su due righe se contiene " — "
  const [mainTitle, subtitle] = title.includes(' — ')
    ? title.split(' — ').map(s => s.trim())
    : [title, null];

  const titleY1   = subtitle ? 305 : 330;
  const titleY2   = 365;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <!-- Gradiente da sinistra: crea una zona leggibile per il testo -->
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#1F180F" stop-opacity="0.82"/>
      <stop offset="55%"  stop-color="#1F180F" stop-opacity="0.50"/>
      <stop offset="100%" stop-color="#1F180F" stop-opacity="0.10"/>
    </linearGradient>
    <!-- Gradiente verticale scuro sul fondo -->
    <linearGradient id="bot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="60%"  stop-color="#1F180F" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1F180F" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <!-- Overlay scrim -->
  <rect width="${W}" height="${H}" fill="url(#grad)"/>
  <rect width="${W}" height="${H}" fill="url(#bot)"/>

  <!-- Logo Localis — in alto a sinistra -->
  <text x="64" y="72"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="22" font-weight="400" letter-spacing="4"
    fill="#FAF7F2" opacity="0.9"
    text-transform="uppercase">
    ${esc(logoText.toUpperCase())}
  </text>

  <!-- Linea accent decorativa -->
  <rect x="64" y="84" width="40" height="1.5" fill="#B46E3C" opacity="0.9"/>

  <!-- Capitoli badge — in alto a destra -->
  <rect x="${W - 180}" y="48" width="116" height="30" rx="4"
    fill="#FAF7F2" fill-opacity="0.12"/>
  <text x="${W - 122}" y="68"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="13" font-weight="400" letter-spacing="2"
    text-anchor="middle"
    fill="#FAF7F2" opacity="0.85">
    ${chapLabel.toUpperCase()}
  </text>

  <!-- Titolo principale -->
  <text x="64" y="${titleY1}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="56" font-weight="400" letter-spacing="-0.5"
    fill="#FAF7F2">
    ${mainTitle}
  </text>
  ${subtitle ? `<text x="64" y="${titleY2}"
    font-family="Georgia, serif"
    font-size="38" font-weight="400" font-style="italic"
    letter-spacing="0"
    fill="#FAF7F2" opacity="0.80">
    ${subtitle}
  </text>` : ''}

  <!-- Linea accent sotto il titolo -->
  <rect x="64" y="${subtitle ? titleY2 + 22 : titleY1 + 18}"
    width="72" height="2" fill="#B46E3C"/>

  <!-- URL brand — in basso a sinistra -->
  <text x="64" y="${H - 36}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="16" font-weight="400" letter-spacing="2"
    fill="#FAF7F2" opacity="0.55">
    localis.guide
  </text>
</svg>`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

  const files = (await readdir(GUIDES)).filter(f => f.endsWith('.mdx'));
  console.log(`\n📸  Generazione OG images — ${files.length} guide\n`);

  let ok = 0, skip = 0, err = 0;

  for (const file of files) {
    const src  = await readFile(join(GUIDES, file), 'utf8');
    const meta = parseFrontmatter(src);

    if (!meta) {
      console.warn(`  ⚠  ${file} — frontmatter non parsabile, skip`);
      skip++;
      continue;
    }

    const { slug, cover, title_it, chapters } = meta;
    const coverPath = join(PUBLIC, cover.replace(/^\//, ''));
    const outPath   = join(OUT, `og-${slug}.jpg`);

    if (!existsSync(coverPath)) {
      console.warn(`  ⚠  ${slug} — cover non trovata: ${coverPath}, skip`);
      skip++;
      continue;
    }

    try {
      const svgBuffer = Buffer.from(buildOverlaySvg(title_it, chapters));

      await sharp(coverPath)
        .resize(W, H, { fit: 'cover', position: 'center' })
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .jpeg({ quality: 88, mozjpeg: true })
        .toFile(outPath);

      console.log(`  ✓  og-${slug}.jpg`);
      ok++;
    } catch (e) {
      console.error(`  ✗  ${slug} — ${e.message}`);
      err++;
    }
  }

  console.log(`\n  Done: ${ok} generate, ${skip} skip, ${err} errori\n`);
}

main();
