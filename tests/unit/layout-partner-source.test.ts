import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layoutPath = new URL('../../src/components/Layout.astro', import.meta.url);

describe('layout partner tracking', () => {
  it('tracks qr partner landings once per session', () => {
    const source = readFileSync(layoutPath, 'utf8');

    expect(source).toContain('qr_landing_viewed');
    expect(source).toContain('sessionStorage.getItem(trackKey)');
    expect(source).toContain("source: 'partner_qr'");
    expect(source).toContain('window.localisTrack');
  });
});
