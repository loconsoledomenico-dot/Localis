/// <reference path="../.astro/types.d.ts" />

declare global {
  interface Window {
    plausible?: ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
      q?: unknown[];
    };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    localisTrack?: (name: string, params?: Record<string, string | number | boolean>) => void;
  }
}

export {};
