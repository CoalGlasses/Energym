import { useSiteAppearance } from '../utils/siteAppearanceClient';
import { Reveal } from './Reveal';
import { SmartImage } from './SmartImage';

export function TrainersSection() {
  const { trainers } = useSiteAppearance();

  return (
    <section
      id="trainers"
      className="py-12 sm:py-20 lg:py-24 bg-[#1A1A1A] border-y border-[#2A2A2A]"
    >
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-7 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight [text-wrap:balance]">
            Certified Coaching Team
          </h2>
          <p className="mt-2.5 sm:mt-3 text-[#A3A3A3] text-sm sm:text-base leading-relaxed">
            Train alongside experienced coaches who guide technique, progressive overload, and sustainable nutrition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {trainers.map((trainer) => (
            <article
              key={trainer.id}
              className="group rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden hover:border-[#22C55E]/60 transition-colors"
            >
              <div className="aspect-[4/3] md:aspect-[3/4] w-full overflow-hidden bg-[#1A1A1A]">
                <SmartImage
                  key={trainer.photoSrc}
                  src={trainer.photoSrc}
                  alt={trainer.photoAlt}
                  placeholderLabel={trainer.placeholderLabel}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="p-4 sm:p-6 space-y-1.5 sm:space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">{trainer.name}</h3>
                <p className="text-sm font-medium text-[#22C55E]">{trainer.speciality}</p>
                <p className="text-sm text-[#A3A3A3] tabular-nums">
                  {trainer.experienceYears}+ Years Experience
                </p>
              </div>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
