import { Phone } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import { useHeroImageSource } from '../utils/siteAppearanceClient';
import { openCallNowModal } from './CallNowModal';
import { SmartImage } from './SmartImage';

export function HeroSection() {
  const { hero } = ENERGYM_CONFIG;
  const { heroImageSrc } = useHeroImageSource();

  return (
    <section
      id="home"
      className="relative min-h-[58vh] sm:min-h-[75vh] lg:min-h-[88vh] flex items-center bg-[#0A0A0A] overflow-hidden"
    >
      {/* Full-bleed Gym Floor Background */}
      <div className="absolute inset-0">
        <SmartImage
          key={heroImageSrc}
          src={heroImageSrc}
          alt={hero.imageAlt}
          placeholderLabel={hero.placeholderLabel}
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover object-center"
        />
        {/* Measured Dark Scrim for >= 4.5:1 text contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-[#0A0A0A]/65 to-[#0A0A0A]/25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/40"
        />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-24 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-medium text-[#A3A3A3] tracking-wide mb-3 sm:mb-4">
            {hero.locationLine}
          </p>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.12] [text-wrap:balance]">
            {hero.headline}
          </h1>

          <p className="mt-3.5 sm:mt-5 text-sm sm:text-lg text-[#A3A3A3] leading-relaxed max-w-xl">
            {hero.subtext}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <a
              href="#trial"
              className="inline-flex items-center justify-center px-5 py-3 sm:px-6 sm:py-3.5 rounded-md bg-[#22C55E] text-[#0A0A0A] font-semibold text-sm sm:text-base hover:bg-[#16A34A] transition-colors whitespace-nowrap shrink-0"
            >
              {hero.primaryCtaLabel}
            </a>

            <button
              type="button"
              onClick={openCallNowModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-md border border-[#A3A3A3]/40 bg-[#0A0A0A]/60 text-white font-semibold text-sm sm:text-base hover:border-[#22C55E] hover:text-[#22C55E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
              <span>{hero.secondaryCtaLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
