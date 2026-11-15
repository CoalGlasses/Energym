import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { getNextGalleryIndex } from '../utils/energymUtils';
import { useSiteAppearance } from '../utils/siteAppearanceClient';
import { BrandTitle } from './EnergymLogo';
import { Reveal } from './Reveal';
import { SmartImage } from './SmartImage';

export function GymGallerySection() {
  const { galleryPhotos: photos } = useSiteAppearance();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveIndex(null);
      } else if (event.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : getNextGalleryIndex(prev, 'next', photos.length)
        );
      } else if (event.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : getNextGalleryIndex(prev, 'prev', photos.length)
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, photos.length]);

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <section id="gym" className="py-12 sm:py-20 lg:py-24 bg-[#0A0A0A]">
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-7 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight [text-wrap:balance]">
            <BrandTitle text="Inside Energym" />
          </h2>
          <p className="mt-2.5 sm:mt-3 text-[#A3A3A3] text-sm sm:text-base leading-relaxed">
            Dedicated free-weight bays, calibrated lifting racks, sprint turf, and commercial cardio machines in Scheme 78.
          </p>
        </div>

        {/* 6-photo responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View larger photo: ${photo.caption}`}
              className="group relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#22C55E]"
            >
              <SmartImage
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                placeholderLabel={photo.placeholderLabel}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/85 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                <span className="text-sm font-medium text-white leading-snug">
                  {photo.caption}
                </span>
                <span className="w-8 h-8 rounded-md bg-[#0A0A0A]/80 border border-[#2A2A2A] flex items-center justify-center text-white group-hover:border-[#22C55E] group-hover:text-[#22C55E] transition-colors shrink-0">
                  <Expand className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </Reveal>

      {/* Lightbox Dialog */}
      {activePhoto && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.caption}
          className="fixed inset-0 z-50 bg-[#0A0A0A]/95 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#2A2A2A]">
              <p className="text-sm font-medium text-white truncate pr-4">
                {activePhoto.caption}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#A3A3A3] tabular-nums">
                  {activeIndex + 1} / {photos.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveIndex(null)}
                  aria-label="Close photo lightbox"
                  className="w-9 h-9 rounded-md border border-[#2A2A2A] bg-[#0A0A0A] text-white flex items-center justify-center hover:border-[#22C55E] hover:text-[#22C55E] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="relative aspect-[4/3] bg-[#0A0A0A]">
              <SmartImage
                key={activePhoto.src}
                src={activePhoto.src}
                alt={activePhoto.alt}
                placeholderLabel={activePhoto.placeholderLabel}
                loading="eager"
                className="w-full h-full object-cover"
              />

              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === null ? 0 : getNextGalleryIndex(prev, 'prev', photos.length)
                  )
                }
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md bg-[#0A0A0A]/85 border border-[#2A2A2A] text-white flex items-center justify-center hover:border-[#22C55E] hover:text-[#22C55E] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) =>
                    prev === null ? 0 : getNextGalleryIndex(prev, 'next', photos.length)
                  )
                }
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md bg-[#0A0A0A]/85 border border-[#2A2A2A] text-white flex items-center justify-center hover:border-[#22C55E] hover:text-[#22C55E] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
