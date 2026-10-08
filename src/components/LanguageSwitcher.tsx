import { getLocalizedPath, languages, type Lang } from '../i18n/utils';

interface Props {
  currentLang: Lang;
  currentPath: string;
}

export default function LanguageSwitcher({ currentLang, currentPath }: Props) {
  const targetLang: Lang = currentLang === 'ar' ? 'en' : 'ar';
  const href = getLocalizedPath(currentPath, targetLang);

  return (
    <a
      href={href}
      className="inline-flex items-center rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-600"
      hrefLang={targetLang}
    >
      {languages[targetLang]}
    </a>
  );
}
