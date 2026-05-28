// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
    sitemap({
      i18n: {
        defaultLocale: 'it',
        locales: {
          it: 'it-IT',
          en: 'en-US',
          de: 'de-DE',
        },
      },
      filter: (page) =>
        !page.includes('/access/') &&
        !page.includes('/api/') &&
        !page.includes('/thanks') &&
        !page.includes('/access-invalid') &&
        !page.includes('/recover'),
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
    }),
  ],
});
