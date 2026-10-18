// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';


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

  // Railway terminates HTTPS at its proxy and forwards plain HTTP, so without
  // trusting X-Forwarded-Proto/Host Astro sees the request as http:// and its
  // origin check rejects the admin's multipart uploads (browser sends an
  // https:// Origin) with a 403. Only these hosts' forwarded headers are trusted.
  security: {
    allowedDomains: [
      { hostname: 'www.originupvc.com', protocol: 'https' },
      { hostname: 'originupvc.com', protocol: 'https' },
      { hostname: '**.up.railway.app', protocol: 'https' },
    ],
  },

  // Admin-uploaded content used to be published as "products"; it's now
  // "articles". Keep old links and search results working.
  redirects: {
    '/ar/products': '/ar/articles',
    '/en/products': '/en/articles',
    '/ar/products/[slug]': '/ar/articles/[slug]',
    '/en/products/[slug]': '/en/articles/[slug]',
  },

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
    // The sitemap is served live by src/pages/sitemap-index.xml.ts so it
    // includes products added from the admin panel.
    react()
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});