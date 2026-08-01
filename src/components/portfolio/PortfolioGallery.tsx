import { useCallback, useEffect, useRef, useState } from 'react';
import type { PortfolioItem } from '../../lib/dataStore';
import type { Lang } from '../../i18n/utils';

interface Props {
  items: PortfolioItem[];
  lang: Lang;
  dateLabel: string;
  viewImageLabel: string;
  closeLabel: string;
}

const SWIPE_THRESHOLD_PX = 40;

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
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const activeProject = activeProjectIndex === null ? null : items[activeProjectIndex];

  const open = useCallback((index: number) => {
    setActiveProjectIndex(index);
    setActivePhotoIndex(0);
  }, []);
  const close = useCallback(() => setActiveProjectIndex(null), []);

  const showPrevPhoto = useCallback(() => {
    if (!activeProject) return;
    setActivePhotoIndex((i) => (i - 1 + activeProject.images.length) % activeProject.images.length);
  }, [activeProject]);
  const showNextPhoto = useCallback(() => {
    if (!activeProject) return;
    setActivePhotoIndex((i) => (i + 1) % activeProject.images.length);
  }, [activeProject]);

  useEffect(() => {
    if (activeProjectIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') showNextPhoto();
      if (e.key === 'ArrowLeft') showPrevPhoto();
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeProjectIndex, close, showNextPhoto, showPrevPhoto]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    // Swiping right (positive delta) reveals the previous photo, left reveals the next.
    if (deltaX > 0) showPrevPhoto();
    else showNextPhoto();
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            onClick={() => open(index)}
            className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white text-start shadow-sm transition hover:shadow-md"
            aria-label={viewImageLabel}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={item.images[0]}
                alt={description(item, lang)}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              {item.images.length > 1 && (
                <span className="absolute end-2 top-2 rounded-full bg-slate-950/70 px-2 py-0.5 text-xs font-semibold text-white">
                  1 / {item.images.length}
                </span>
              )}
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

      {activeProject && (
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

          {activeProject.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrevPhoto();
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
                  showNextPhoto();
                }}
                aria-label="Next"
                className="absolute end-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 rtl:rotate-180">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeProject.images[activePhotoIndex]}
              alt={description(activeProject, lang)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="max-h-[70vh] w-full touch-pan-y select-none rounded-xl object-contain"
            />

            {activeProject.images.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5">
                {activeProject.images.map((img, i) => (
                  <span
                    key={img}
                    className={`h-1.5 w-1.5 rounded-full transition ${i === activePhotoIndex ? 'bg-white' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 text-center text-white">
              <p className="text-base">{description(activeProject, lang)}</p>
              <p className="mt-1 text-sm text-white/60">
                {dateLabel}: {formatDate(activeProject.date, lang)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
