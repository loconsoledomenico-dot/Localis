// Canary GA4 — verifica che il tracking sia VIVO end-to-end.
//
// Perché esiste: il 2026-06-28 GA4 ha smesso di registrare per 4 giorni in
// silenzio (Google ha migrato la raccolta a region1.analytics.google.com e la
// CSP bloccava il nuovo endpoint). Nessun errore server, nessun build rotto:
// solo dati spariti. Questo canary carica il sito reale in un browser vero,
// spara un hit e verifica che arrivi a Google (status 204). Se no → alert.
//
// Uso: node scripts/ga4-canary.mjs   (stampa JSON, exit 0 sempre per parsing)
// Il traffico è taggato ?localis_internal=1 così non sporca i report.

import { chromium } from 'playwright';

const URL = 'https://localis.guide/?localis_internal=1';
const result = { healthy: null, hits: 0, statuses: [], cspBlocked: [], error: null, checkedAt: new Date().toISOString() };

let browser;
try {
  // Chrome di SISTEMA (channel), non il browser bundle Playwright: quest'ultimo
  // sparisce agli aggiornamenti (2026-07: chromium_headless_shell mancante →
  // canary morto). Fallback al bundle se Chrome di sistema non c'è.
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const ctx = await browser.newContext();
  // Consenso pre-impostato: CookieBanner fa partire localisGA4Init da solo.
  await ctx.addInitScript(() => {
    try { localStorage.setItem('lg_consent', JSON.stringify({ analytics: true, ts: Date.now() })); } catch (e) {}
  });
  const page = await ctx.newPage();

  page.on('response', (res) => {
    const u = res.url();
    if (/\/g\/collect/.test(u) && /analytics\.google\.com|google-analytics\.com/.test(u)) {
      result.hits += 1;
      result.statuses.push(res.status());
    }
  });
  page.on('console', (m) => {
    const t = m.text();
    // Solo blocchi dell'endpoint di RACCOLTA (/g/collect): esclude il pixel ads
    // ga-audiences, che è rumore e non c'entra con la misurazione.
    if (/cannot load|Refused to connect|Content Security/i.test(t) && /\/g\/collect|\/collect\?/i.test(t)) {
      if (result.cspBlocked.length < 5) result.cspBlocked.push(t.slice(0, 140));
    }
  });

  await page.goto(URL, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(6000);
  await page.evaluate(() => { try { window.localisTrack && window.localisTrack('canary_check', {}); } catch (e) {} });
  await page.waitForTimeout(6000);

  result.healthy = result.hits > 0 && result.statuses.every((s) => s >= 200 && s < 400);
} catch (e) {
  // healthy=null = non ho potuto determinare (browser assente, rete): NON è un
  // "GA4 morto", il digest lo tratta come "check non eseguito", non come alert.
  result.error = String((e && e.message) || e).slice(0, 200);
  result.healthy = null;
} finally {
  if (browser) { try { await browser.close(); } catch (e) {} }
}

console.log(JSON.stringify(result));
process.exit(0);
