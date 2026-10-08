import { defineMiddleware } from 'astro:middleware';
import { middleware as i18nMiddleware } from 'astro:i18n';
import { readUploadedImage } from './lib/dataStore';

// /admin and /api routes intentionally live outside the /ar|/en namespace, so
// they're excluded from Astro's automatic locale-prefix enforcement (which
// would otherwise 404 any non-locale-prefixed page route).
const i18n = i18nMiddleware({
  prefixDefaultLocale: true,
  redirectToDefaultLocale: true,
});

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return next();
  }
  // Admin-uploaded images are stored in the data directory, not the build.
  if (pathname.startsWith('/portfolio/') || pathname.startsWith('/products/')) {
    const image = await readUploadedImage(pathname);
    if (image) {
      return new Response(new Uint8Array(image.body), {
        headers: {
          'Content-Type': image.contentType,
          // filenames are unique per upload, so they never change in place
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }
  return i18n(context, next) as Promise<Response>;
});
