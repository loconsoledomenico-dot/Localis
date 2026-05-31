import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const thanksPagePath = new URL('../../src/pages/thanks.astro', import.meta.url);

describe('thanks page purchased guide UI', () => {
  it('renders purchased guide cards from the shared thanks page model', () => {
    const source = readFileSync(thanksPagePath, 'utf8');

    expect(source).toContain('buildThanksPageModel');
    expect(source).toContain('model.cards.map');
    expect(source).toContain('card.ctaHref');
    expect(source).toContain('model.cardCta');
  });
});
