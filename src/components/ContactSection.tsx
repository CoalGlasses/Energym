import { FormEvent, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import {
  buildWhatsAppUrl,
  ContactFormErrors,
  ContactFormValues,
  formatContactWhatsAppMessage,
  validateContactForm,
} from '../utils/energymUtils';
import { BrandTitle } from './EnergymLogo';
import { Reveal } from './Reveal';

export function ContactSection() {
  const { business, timings } = ENERGYM_CONFIG;
  const [values, setValues] = useState<ContactFormValues>({
    name: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submittedUrl, setSubmittedUrl] = useState<string | null>(null);
  const whatsappTriggerRef = useRef<HTMLAnchorElement | null>(null);

  const directWhatsAppUrl = buildWhatsAppUrl(
    business.whatsappDigits,
    `Hi ${business.name}, I would like to know more about memberships.`
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateContactForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setSubmittedUrl(null);
      return;
    }

    const message = formatContactWhatsAppMessage(values, business.name);
    const url = buildWhatsAppUrl(business.whatsappDigits, message);
    setSubmittedUrl(url);

    window.setTimeout(() => {
      whatsappTriggerRef.current?.click();
    }, 50);
  };

  return (
    <section
      id="contact"
      className="py-12 sm:py-20 lg:py-24 bg-[#1A1A1A] border-t border-[#2A2A2A]"
    >
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-7 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight [text-wrap:balance]">
            <BrandTitle text="Visit or Contact Energym" />
          </h2>
          <p className="mt-2.5 sm:mt-3 text-[#A3A3A3] text-sm sm:text-base leading-relaxed">
            Drop by our Vijay Nagar facility in Scheme 78, call us directly, or send a message on WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Left Column: Contact Form + Details + Timings */}
          <div className="flex flex-col justify-between gap-6 sm:gap-8 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] p-5 sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Send a Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-sm font-medium text-white mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={values.name}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    aria-invalid={Boolean(errors.name)}
                    className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none transition-colors"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-white flex items-center gap-1.5">
                      <span aria-hidden="true" className="text-[#22C55E]">!</span>
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-sm font-medium text-white mb-1.5"
                  >
                    Phone
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="10-digit mobile"
                    value={values.phone}
                    onChange={(e) => {
                      setValues((prev) => ({ ...prev, phone: e.target.value }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    aria-invalid={Boolean(errors.phone)}
                    className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none transition-colors tabular-nums"
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs font-medium text-white flex items-center gap-1.5">
                      <span aria-hidden="true" className="text-[#22C55E]">!</span>
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-white mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={3}
                  placeholder="Ask about personal training, morning batch availability, or corporate plans..."
                  value={values.message}
                  onChange={(e) => {
                    setValues((prev) => ({ ...prev, message: e.target.value }));
                    if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  aria-invalid={Boolean(errors.message)}
                  className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none transition-colors resize-none"
                />
                {errors.message && (
                  <p className="mt-1.5 text-xs font-medium text-white flex items-center gap-1.5">
                    <span aria-hidden="true" className="text-[#22C55E]">!</span>
                    <span>{errors.message}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#22C55E] text-[#0A0A0A] font-semibold text-sm hover:bg-[#16A34A] transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Send via WhatsApp</span>
              </button>

              {submittedUrl && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-md bg-[#1A1A1A] border border-[#22C55E] p-3.5 flex items-center justify-between gap-3"
                >
                  <p className="text-xs sm:text-sm text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
                    <span>Message prepared for WhatsApp</span>
                  </p>
                  <a
                    ref={whatsappTriggerRef}
                    href={submittedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#22C55E] hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Open WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </form>

            {/* Business Contact Info & Gym Timings */}
            <div className="pt-6 border-t border-[#2A2A2A] space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-[#A3A3A3]">Address</p>
                  <p className="text-sm text-white leading-relaxed mt-0.5">
                    {business.address}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-medium text-[#A3A3A3]">Phone</p>
                    <a
                      href={business.phoneHref}
                      target="_top"
                      className="text-sm font-medium text-white hover:text-[#22C55E] transition-colors tabular-nums"
                    >
                      {business.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MessageCircle
                    className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-medium text-[#A3A3A3]">WhatsApp</p>
                    <a
                      href={directWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-[#22C55E] transition-colors tabular-nums"
                    >
                      {business.whatsappDisplay}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="w-full">
                  <p className="text-xs font-medium text-[#A3A3A3] mb-1">
                    Gym Hours &amp; Facilities
                  </p>
                  <div className="space-y-1.5">
                    {timings.map((slot) => (
                      <div
                        key={slot.days}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-white">{slot.days}</span>
                        <span className="text-[#22C55E] font-medium tabular-nums text-right">
                          {slot.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Embedded Google Map + Get Directions */}
          <div className="flex flex-col rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden">
            <div className="relative flex-1 min-h-[260px] sm:min-h-[360px] bg-[#1A1A1A] flex items-center justify-center">
              {/* Fallback location card visible behind iframe if embed is slow or offline */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                <div className="w-12 h-12 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6 text-[#22C55E]" aria-hidden="true" />
                </div>
                <p className="text-base font-semibold text-white">Energym · Vijay Nagar</p>
                <p className="text-xs text-[#A3A3A3] max-w-xs mt-1 leading-relaxed">
                  {business.address}
                </p>
              </div>

              <iframe
                title="Energym Vijay Nagar Indore Location Map"
                src={business.googleMapsEmbedUrl}
                referrerPolicy="no-referrer-when-downgrade"
                className="relative z-10 w-full h-full min-h-[260px] sm:min-h-[360px] border-0"
              />
            </div>

            <div className="p-6 border-t border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0A0A] shrink-0">
              <div>
                <p className="text-sm font-semibold text-white">
                  <BrandTitle text="Energym · Vijay Nagar" />
                </p>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  {business.shortLocation}
                </p>
              </div>
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#22C55E] text-[#0A0A0A] text-sm font-semibold hover:bg-[#16A34A] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Get Directions</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
