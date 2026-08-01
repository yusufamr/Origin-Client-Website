import { ar } from './ar';
import { en } from './en';
import type { Dictionary } from './translations';

export const languages = {
  ar: 'العربية',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'ar';

const dictionaries: Record<Lang, Dictionary> = { ar, en };

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang === 'ar' || maybeLang === 'en') return maybeLang;
  return defaultLang;
}

export function useTranslations(lang: Lang): Dictionary {
  return dictionaries[lang];
}

export function dir(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Swaps the leading /ar|/en segment of a path for the target language. */
export function getLocalizedPath(pathname: string, lang: Lang): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'ar' || segments[0] === 'en') {
    segments[0] = lang;
  } else {
    segments.unshift(lang);
  }
  return '/' + segments.join('/') + '/';
}

/** Builds a path within the current language, e.g. path('products/windows', 'en') -> /en/products/windows/ */
export function path(pathname: string, lang: Lang): string {
  const cleaned = pathname.replace(/^\/+|\/+$/g, '');
  return cleaned ? `/${lang}/${cleaned}/` : `/${lang}/`;
}
