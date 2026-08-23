import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Un parametro inviato con un evento e' interrogabile in GA4 solo se esiste una
// dimensione personalizzata con lo STESSO nome. Nell'audit del 23/08 tre nomi
// erano fuori posto: il player mandava `guide` (dimensione: `guide_slug`),
// audio-analytics mandava `language` (dimensione: `lang`), e `guide_slug`
// risultava registrata ma non inviata da nessuno.
//
// Elenco allineato alle dimensioni realmente registrate sulla property
// 538539129, lette via Admin API il 2026-08-23.
const REGISTERED = new Set([
  'audio_asset_id', 'audio_context', 'audio_type', 'cta_source', 'guide_slug',
  'landing_path', 'lang', 'listen_bucket', 'partner_id', 'product', 'qr_path',
  'qr_source', 'qr_url', 'reason', 'traffic_type',
]);

// Parametri che GA4 gestisce nativamente o che sono metriche, non dimensioni.
const BUILT_IN = new Set([
  'value', 'currency', 'transaction_id', 'items', 'page_path', 'page_location',
  'send_page_view', 'anonymize_ip', 'listen_seconds', 'max_position_seconds',
  'listen_percent', 'audio_duration_seconds', 'udio_duration_seconds',
  'guide_count', 'guide_slugs', 'session', 'percent',
  // GA4 ricava nativamente sorgente/mezzo/campagna dai utm_* nell'URL:
  // come parametri d'evento sarebbero un doppione.
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
]);

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, acc);
    else if (/\.(astro|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/**
 * Nomi di parametro che finiscono in un evento GA4. Due sorgenti, perche' i
 * parametri non arrivano tutti da oggetti letterali: attachAttribution() ne
 * aggiunge altri per assegnazione, e la prima versione di questo test non li
 * vedeva — dava per pulito un `qr_url` che era orfano.
 */
function trackedParams(): { param: string; file: string }[] {
  const out: { param: string; file: string }[] = [];
  for (const file of sourceFiles('src')) {
    const src = readFileSync(file, 'utf8');
    const short = file.split('\\').join('/');

    // 1. oggetti letterali passati a localisTrack(...)
    for (const call of src.matchAll(/localisTrack\(\s*[^,]+,\s*\{([^}]*)\}/g)) {
      for (const key of call[1].matchAll(/(?:^|[\s,{])([a-z_][a-z0-9_]*)\s*:/g)) {
        out.push({ param: key[1], file: short });
      }
    }

    // 2. parametri aggiunti per assegnazione: params.x = ... / if (!params.x)
    //    Solo nei file che fanno davvero tracking: altrove `params` e' il nome
    //    generico degli argomenti di Stripe e simili, e darebbe falsi positivi.
    if (!src.includes('localisTrack')) continue;
    for (const m of src.matchAll(/params\.([a-z_][a-z0-9_]*)\s*(?:=[^=]|\))/g)) {
      out.push({ param: m[1], file: short });
    }
  }
  return out;
}

describe('nomi dei parametri inviati a GA4', () => {
  const params = trackedParams();

  it('ci sono chiamate di tracking da controllare', () => {
    expect(params.length).toBeGreaterThan(3);
  });

  it('ogni parametro inviato ha una dimensione registrata', () => {
    const orfani = params.filter((p) => !REGISTERED.has(p.param) && !BUILT_IN.has(p.param));
    expect(
      orfani.map((o) => `${o.param} (${o.file})`),
      'parametri senza dimensione GA4: non saranno mai interrogabili',
    ).toEqual([]);
  });

  it('nessuno manda piu\u2019 il vecchio nome `guide`', () => {
    expect(params.map((p) => p.param)).not.toContain('guide');
  });

  it('audio-analytics manda `lang`, non `language`', () => {
    const src = readFileSync('src/lib/audio-analytics.ts', 'utf8');
    const base = src.slice(src.indexOf('const baseParams'), src.indexOf('return params'));
    expect(base).toContain('lang: language');
    expect(base).not.toMatch(/^\s{6}language,$/m);
  });

  it('guide_slug non e\u2019 piu\u2019 una dimensione orfana', () => {
    const sent = new Set(params.map((p) => p.param));
    const srcAudio = readFileSync('src/lib/audio-analytics.ts', 'utf8');
    expect(sent.has('guide_slug') || srcAudio.includes('params.guide_slug')).toBe(true);
  });
});
