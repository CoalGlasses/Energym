import { Check, MessageCircle } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import {
  buildWhatsAppUrl,
  formatCurrencyINR,
  formatMembershipWhatsAppMessage,
} from '../utils/energymUtils';
import { Reveal } from './Reveal';

export function MembershipSection() {
  const { memberships, business } = ENERGYM_CONFIG;

  return (
    <section id="membership" className="py-12 sm:py-20 lg:py-24 bg-[#0A0A0A]">
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-7 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight [text-wrap:balance]">
            Membership Plans
          </h2>
          <p className="mt-2.5 sm:mt-3 text-[#A3A3A3] text-sm sm:text-base leading-relaxed">
            Straightforward memberships with full floor access and coach guidance. Choose the duration that fits your routine.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
          {memberships.map((plan) => {
            const formattedPrice = `${formatCurrencyINR(plan.priceInr)}/-`;
            const whatsappUrl = buildWhatsAppUrl(
              business.whatsappDigits,
              formatMembershipWhatsAppMessage(
                plan.name,
                formattedPrice,
                plan.billingPeriod,
                business.name
              )
            );

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-lg p-5 sm:p-6 border transition-colors ${
                  plan.popular
                    ? 'bg-[#1A1A1A] border-[#22C55E]'
                    : 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#A3A3A3]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="text-lg font-bold text-white whitespace-nowrap">{plan.name}</h3>
                    {plan.popular && (
                      <span className="px-2 py-0.5 rounded-md bg-[#22C55E] text-[#0A0A0A] text-[11px] font-semibold whitespace-nowrap shrink-0">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                      {formattedPrice}
                    </span>
                    <span className="text-xs text-[#A3A3A3] whitespace-nowrap">
                      / {plan.billingPeriod}
                    </span>
                  </div>

                  <p className="text-sm text-[#A3A3A3] leading-relaxed pb-6 border-b border-[#2A2A2A]">
                    {plan.description}
                  </p>

                  <ul className="mt-6 space-y-3.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-white">
                        <Check
                          className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-md font-semibold text-sm transition-colors whitespace-nowrap ${
                      plan.popular
                        ? 'bg-[#22C55E] text-[#0A0A0A] hover:bg-[#16A34A]'
                        : 'bg-[#0A0A0A] text-white border border-[#2A2A2A] hover:border-[#22C55E] hover:text-[#22C55E]'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span>Join Now</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
