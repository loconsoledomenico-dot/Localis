import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const accessPagePath = new URL('../../src/pages/access/[token].astro', import.meta.url);

describe('access page', () => {
  it('renders each purchased guide section with the guide slug as its anchor id', () => {
    const source = readFileSync(accessPagePath, 'utf8');

    expect(source).toMatch(
      /{userGuides\.map\(\(guide\)\s*=>\s*\(\s*<section[^>]*id=\{guide\.data\.slug\}/s,
    );
  });
});
