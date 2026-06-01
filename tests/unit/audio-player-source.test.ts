import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const audioPlayerPath = new URL('../../src/components/AudioPlayer.astro', import.meta.url);

describe('audio player media session support', () => {
  it('configures media session metadata and playback handlers', () => {
    const source = readFileSync(audioPlayerPath, 'utf8');

    expect(source).toContain('navigator.mediaSession.metadata = new MediaMetadata');
    expect(source).toContain("bindAction('play'");
    expect(source).toContain("bindAction('pause'");
    expect(source).toContain("bindAction('seekbackward'");
    expect(source).toContain("bindAction('seekforward'");
    expect(source).toContain('navigator.mediaSession.setPositionState');
  });
});
