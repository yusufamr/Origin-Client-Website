import { useCallback, useEffect, useState } from 'react';
import type { PortfolioItem } from '../../lib/dataStore';
import type { Lang } from '../../i18n/utils';

interface Props {
  items: PortfolioItem[];
  lang: Lang;
  dateLabel: string;
  viewImageLabel: string;
  closeLabel: string;
}

function description(item: PortfolioItem, lang: Lang): string {
  return lang === 'ar' ? item.descriptionAr : item.descriptionEn;
}

function formatDate(dateStr: string, lang: Lang): string {
  try {
    return new Date(dateStr).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function PortfolioGallery({ items, lang, dateLabel, viewImageLabel, closeLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length]
  );
  const showNext = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, close, showNext, showPrev]);

  const activeItem = activeIndex === null ? null : items[activeIndex];

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setActiveIndex(index)}
            className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white text-start shadow-sm transition hover:shadow-md"
            aria-label={viewImageLabel}
          >
            <div className="aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={item.imagePath}
                alt={description(item, lang)}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-700">{description(item, lang)}</p>
              <p className="mt-1 text-xs text-slate-400">
                {dateLabel}: {formatDate(item.date, lang)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            aria-label="Previous"
            className="absolute start-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 rtl:rotate-180">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            aria-label="Next"
            className="absolute end-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 rtl:rotate-180">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeItem.imagePath}
              alt={description(activeItem, lang)}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
            <div className="mt-4 text-center text-white">
              <p className="text-base">{description(activeItem, lang)}</p>
              <p className="mt-1 text-sm text-white/60">
                {dateLabel}: {formatDate(activeItem.date, lang)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
