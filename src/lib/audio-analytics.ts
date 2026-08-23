type Scalar = string | number | boolean;

type TrackParams = Record<string, Scalar>;

type TrackName =
  | 'preview_start'
  | 'audio_preview_played'
  | 'preview_10s'
  | 'preview_complete'
  | 'audio_preview_session';

interface AudioTrackerOptions {
  audio: HTMLAudioElement;
  guideSlug?: string;
  audioAssetId: string;
  language: string;
  audioContext: string;
  audioType?: string;
  product?: string;
  pagePath?: string;
  extraParams?: TrackParams;
}

interface AudioTracker {
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTimeUpdate: () => void;
  cleanup: () => void;
}

declare global {
  interface Window {
    localisTrack?: (name: string, params?: Record<string, string | number | boolean>) => void;
  }
}

function roundSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

function listenBucket(seconds: number): string {
  if (seconds >= 60) return '60_plus';
  if (seconds >= 30) return '30_59';
  if (seconds >= 10) return '10_29';
  if (seconds >= 5) return '05_09';
  if (seconds >= 1) return '01_04';
  return '00';
}

function track(name: TrackName, params: TrackParams) {
  if (typeof window.localisTrack === 'function') {
    window.localisTrack(name, params);
  }
}

export function createAudioAnalyticsTracker(options: AudioTrackerOptions): AudioTracker {
  const {
    audio,
    guideSlug,
    audioAssetId,
    language,
    audioContext,
    audioType,
    product,
    pagePath = window.location.pathname,
    extraParams = {},
  } = options;

  let started = false;
  let fired10s = false;
  let segmentStartMs: number | null = null;
  let maxPositionSeconds = 0;

  const baseParams = (): TrackParams => {
    const durationSeconds = roundSeconds(audio.duration || 0);
    const maxSeconds = roundSeconds(maxPositionSeconds);
    const params: TrackParams = {
      audio_asset_id: audioAssetId,
      audio_context: audioContext,
      // La dimensione registrata in GA4 e' `lang` (come la mandano il player e
      // il webhook). `language` non e' registrata: restava non interrogabile.
      lang: language,
      page_path: pagePath,
      audio_duration_seconds: durationSeconds,
      // Backward-compatibility for a GA4 custom metric registered with a missing leading "a".
      udio_duration_seconds: durationSeconds,
      max_position_seconds: maxSeconds,
      listen_percent: durationSeconds > 0 ? Math.min(100, Math.round((maxSeconds / durationSeconds) * 100)) : 0,
      ...extraParams,
    };

    if (guideSlug) params.guide_slug = guideSlug;
    if (audioType) params.audio_type = audioType;
    if (product) params.product = product;

    return params;
  };

  const segmentSeconds = () => {
    if (segmentStartMs === null) return 0;
    return Math.max(0, (performance.now() - segmentStartMs) / 1000);
  };

  const emitSession = (completed: boolean) => {
    const segment = segmentSeconds();
    const totalListenSeconds = roundSeconds(segment);
    if (!completed && totalListenSeconds === 0) return;

    track('audio_preview_session', {
      ...baseParams(),
      listen_seconds: totalListenSeconds,
      listen_bucket: listenBucket(totalListenSeconds),
      completed,
    });

    segmentStartMs = null;
  };

  const syncMaxPosition = () => {
    if (Number.isFinite(audio.currentTime)) {
      maxPositionSeconds = Math.max(maxPositionSeconds, audio.currentTime);
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && !audio.paused) {
      syncMaxPosition();
      emitSession(false);
    }
  };

  const onPageHide = () => {
    if (!audio.paused) {
      syncMaxPosition();
      emitSession(false);
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', onPageHide);

  return {
    onPlay() {
      syncMaxPosition();
      if (segmentStartMs === null) {
        segmentStartMs = performance.now();
      }

      const params = baseParams();

      if (!started) {
        started = true;
        track('preview_start', params);
      }

      track('audio_preview_played', params);
    },

    onPause() {
      syncMaxPosition();
      emitSession(false);
    },

    onEnded() {
      syncMaxPosition();
      emitSession(true);
      track('preview_complete', {
        ...baseParams(),
        listen_seconds: roundSeconds(maxPositionSeconds),
        listen_bucket: listenBucket(roundSeconds(maxPositionSeconds)),
        completed: true,
      });
    },

    onTimeUpdate() {
      syncMaxPosition();
      if (!fired10s && audio.currentTime >= 10) {
        fired10s = true;
        track('preview_10s', {
          ...baseParams(),
          listen_seconds: 10,
          listen_bucket: listenBucket(10),
        });
      }
    },

    cleanup() {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    },
  };
}
