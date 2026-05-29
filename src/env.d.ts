/// <reference path="../.astro/types.d.ts" />

declare global {
  interface Window {
    plausible?: ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
      q?: unknown[];
    };
    gtag?: (...args: unknown[]) => void;
    posthog?: {
      capture?: (name: string, params?: Record<string, string | number | boolean>) => void;
      init?: (key: string, config?: Record<string, unknown>) => void;
      register?: (params: Record<string, string | number | boolean>) => void;
    };
    __posthog_initialized?: boolean;
    __SV?: number;
    dataLayer?: unknown[];
    localisTrack?: (name: string, params?: Record<string, string | number | boolean>) => void;
  }
}

export {};
