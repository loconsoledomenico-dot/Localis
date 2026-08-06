// Canary anteprima audio — verifica che il click su "Ascolta un assaggio"
// generi davvero l'evento GA4 `audio_preview_played`.
//
// Perché esiste: nel digest il funnel mostra "N scan → 0 anteprime". Uno zero
// lì ha due letture opposte — "nessuno ascolta" (problema di prodotto) oppure
// "l'evento non scatta" (problema di misura) — e finché non le distingui non
// sai se stai leggendo un dato o un guasto. Questo script clicca play su un
// browser vero e guarda quali eventi partono.
//
// NON scrive su GA4: le richieste a /g/collect vengono intercettate e ABORTITE
// dopo la lettura, così il test non inquina la metrica che sta verificando.
//
// Uso: node scripts/preview-canary.mjs [url]   (stampa JSON, exit 0 sempre)

import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://localis.guide/?localis_internal=1';
const result = { ok: null, events: [], previewFired: false, url: URL, error: null, checkedAt: new Date().toISOString() };

const eventsFrom = (req) => {
  const found = [];
  const scan = (s) => { for (const m of String(s || '').matchAll(/[?&\n]en=([^&\n]+)/g)) found.push(decodeURIComponent(m[1])); };
  scan(req.url());
  try { scan(req.postData()); } catch { /* body binario o assente */ }
  return found;
};

let browser;
try {
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  } catch {
    browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  }
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => {
    try { localStorage.setItem('lg_consent', JSON.stringify({ analytics: true, ts: Date.now() })); } catch (e) {}
  });

  await ctx.route(/\/g\/collect/, async (route) => {
    for (const e of eventsFrom(route.request())) if (!result.events.includes(e)) result.events.push(e);
    await route.abort();   // letto il beacon, non lo mando: niente evento finto in GA4
  });

  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load', timeout: 45000 });

  const btn = page.locator('.hero-sample-btn').first();
  await btn.waitFor({ state: 'visible', timeout: 20000 });
  await btn.click();
  await page.waitForTimeout(12000);   // play → beacon (gtag accoda ~1-2s)

  result.previewFired = result.events.includes('audio_preview_played');
  result.ok = result.previewFired;
} catch (e) {
  result.error = String((e && e.message) || e).slice(0, 200);
  result.ok = null;
} finally {
  if (browser) { try { await browser.close(); } catch (e) {} }
}

console.log(JSON.stringify(result));
process.exit(0);
