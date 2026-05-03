/// <reference path="../.astro/types.d.ts" />

declare global {
  interface Window {
    plausible?: ((event: string, options?: { props?: Record<string, string | number | boolean> }) => void) & {
      q?: unknown[];
    };
  }
}

export {};
