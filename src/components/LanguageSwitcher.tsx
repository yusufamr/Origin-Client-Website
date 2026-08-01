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
      className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-600 hover:text-brand-700"
      hrefLang={targetLang}
    >
      {languages[targetLang]}
    </a>
  );
}
