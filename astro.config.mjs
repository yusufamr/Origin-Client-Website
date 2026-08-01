// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import node from '@astrojs/node';

const SITE_URL = 'https://www.originupvc.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,

  // Most marketing pages are prerendered (static) for SEO/speed; the
  // portfolio page and all /admin + /api routes opt out of prerendering
  // (see `export const prerender` in those files) because they read/write
  // JSON files on the server at request time.
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  // routing: 'manual' — Astro's built-in prefix-enforcement would 404 any
  // non-locale-prefixed route (e.g. /admin, /admin/portfolio). Those routes
  // are intentionally outside the ar/en namespace, so locale handling here is
  // done entirely by our own helpers in src/i18n/utils.ts, and the "/" ->
  // "/ar/" redirect is handled explicitly in src/pages/index.astro.
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en'],
    routing: 'manual'
  },

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'ar',
        locales: {
          ar: 'ar',
          en: 'en'
        }
      },
      // Admin pages must never be indexed or listed in the sitemap.
      filter: (page) => !page.includes('/admin')
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});