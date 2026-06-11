// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://localis.guide',
  output: 'server',
  adapter: netlify({
    excludeFiles: [
      './public/audio/guides/**',
      './public/video/**',
      './chunks/**',
      './scripts/*.mp3',
    ],
  }),

  // La guida il-meglio-di-bari è stata sostituita da bari-tavola (2026-06-11);
  // i vecchi URL restano nell'indice Google e nei link condivisi.
  redirects: {
    '/guide/il-meglio-di-bari': '/guide/bari-tavola',
    '/en/guide/il-meglio-di-bari': '/en/guide/bari-tavola',
    '/de/guide/il-meglio-di-bari': '/de/guide/bari-tavola',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: 'it',
    locales: ['it', 'en', 'de'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    mdx(),
  ],
});
