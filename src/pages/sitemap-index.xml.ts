import type { APIRoute } from 'astro';
import { getProducts } from '../lib/dataStore';
import { path, type Lang } from '../i18n/utils';

// Generated per request (not at build time like @astrojs/sitemap) so product
// pages added from the admin panel are listed as soon as they exist.
const LANGS: Lang[] = ['ar', 'en'];
const STATIC_PAGES = ['', 'products', 'portfolio', 'contact'];

export const GET: APIRoute = async ({ site }) => {
  const products = await getProducts();
  const pages = [...STATIC_PAGES, ...products.map((p) => `products/${p.slug}`)];

  const urls = pages.flatMap((page) =>
    LANGS.map((lang) => {
      const loc = new URL(path(page, lang), site);
      const alternates = LANGS.map(
        (alt) => `<xhtml:link rel="alternate" hreflang="${alt}" href="${new URL(path(page, alt), site)}"/>`
      ).join('');
      const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${new URL(path(page, 'ar'), site)}"/>`;
      return `<url><loc>${loc}</loc>${alternates}${xDefault}</url>`;
    })
  );

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
    urls.join('') +
    '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
