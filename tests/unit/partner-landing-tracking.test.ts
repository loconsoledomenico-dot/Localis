import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// qr_scan e' il primo gradino del funnel partner: se smette di partire, le
// scansioni spariscono dai report senza che niente si rompa a video. Il
// tracciamento viveva in Layout.astro come 'qr_landing_viewed' ed e' stato
// spostato in Analytics.astro il 2026-06-29 (era un doppione di qr_scan e
// passava la chiave riservata 'source').
const analyticsPath = new URL('../../src/components/Analytics.astro', import.meta.url);

describe('tracciamento landing partner', () => {
  it('manda qr_scan una volta per sessione, con il partner in chiaro', () => {
    const source = readFileSync(analyticsPath, 'utf8');

    expect(source).toContain("'qr_scan'");
    expect(source).toContain("sessionStorage.getItem('localis_qr_scan_sent')");
    expect(source).toContain("sessionStorage.setItem('localis_qr_scan_sent'");
    expect(source).toContain('partner_id');
    expect(source).toContain('window.localisTrack');
  });
});
