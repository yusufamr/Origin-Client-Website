import { defineMiddleware } from 'astro:middleware';
import { middleware as i18nMiddleware } from 'astro:i18n';

// /admin and /api routes intentionally live outside the /ar|/en namespace, so
// they're excluded from Astro's automatic locale-prefix enforcement (which
// would otherwise 404 any non-locale-prefixed page route).
const i18n = i18nMiddleware({
  prefixDefaultLocale: true,
  redirectToDefaultLocale: true,
});

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    return next();
  }
  return i18n(context, next);
});
