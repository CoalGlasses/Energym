import { FormEvent, useState } from 'react';
import { CalendarCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import {
  TrialFormErrors,
  TrialFormValues,
  validateTrialForm,
} from '../utils/energymUtils';
import type { TrialLead } from '../utils/leadsStore';
import { BrandTitle } from './EnergymLogo';
import { Reveal } from './Reveal';

export function FreeTrialSection() {
  const { freeTrial } = ENERGYM_CONFIG;
  const [values, setValues] = useState<TrialFormValues>({
    name: '',
    phone: '',
    goal: freeTrial.goals[0],
    preferredTime: freeTrial.preferredTimes[0],
  });
  const [errors, setErrors] = useState<TrialFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedLead, setConfirmedLead] = useState<TrialLead | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateTrialForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setConfirmedLead(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/trial-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok || !data?.lead) {
        if (data?.errors && typeof data.errors === 'object') {
          setErrors(data.errors as TrialFormErrors);
        }
        setSubmitError(
          typeof data?.error === 'string'
            ? data.error
            : 'Please review the highlighted fields and try again.'
        );
        return;
      }

      setConfirmedLead(data.lead as TrialLead);
      setValues({
        name: '',
        phone: '',
        goal: freeTrial.goals[0],
        preferredTime: freeTrial.preferredTimes[0],
      });
    } catch {
      setSubmitError('Network error while saving your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="trial"
      className="py-12 sm:py-20 lg:py-24 bg-[#1A1A1A] border-y border-[#2A2A2A]"
    >
      <Reveal className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Offer Context */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight [text-wrap:balance]">
              <BrandTitle text={freeTrial.heading} />
            </h2>
            <p className="text-[#A3A3A3] text-sm sm:text-base leading-relaxed">
              {freeTrial.subheading}
            </p>

            <div className="inline-flex items-center gap-2.5 pt-1 text-sm font-semibold text-[#22C55E]">
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{freeTrial.noPaymentNote}</span>
            </div>

            <div className="pt-4 border-t border-[#2A2A2A] space-y-2 text-sm text-[#A3A3A3]">
              <p className="text-white font-medium">What is included in your day pass:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
                  <span>24×7 access to strength, turf, and cardio zones</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
                  <span>Steam recovery facility (3 days/week on alternate days)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
                  <span>15-minute goal consultation with a floor coach</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
                  <span>Zero obligation — decide only after your session</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Trial Booking Form */}
          <div className="lg:col-span-7">
            <div className="rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] p-5 sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label
                      htmlFor="trial-name"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Full Name
                    </label>
                    <input
                      id="trial-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Aarav Joshi"
                      value={values.name}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, name: e.target.value }));
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'trial-name-error' : undefined}
                      className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none transition-colors"
                    />
                    {errors.name && (
                      <p
                        id="trial-name-error"
                        className="mt-1.5 text-xs font-medium text-white flex items-center gap-1.5"
                      >
                        <span aria-hidden="true" className="text-[#22C55E]">
                          !
                        </span>
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="trial-phone"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Phone Number
                    </label>
                    <input
                      id="trial-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={values.phone}
                      onChange={(e) => {
                        setValues((prev) => ({ ...prev, phone: e.target.value }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'trial-phone-error' : undefined}
                      className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none transition-colors tabular-nums"
                    />
                    {errors.phone && (
                      <p
                        id="trial-phone-error"
                        className="mt-1.5 text-xs font-medium text-white flex items-center gap-1.5"
                      >
                        <span aria-hidden="true" className="text-[#22C55E]">
                          !
                        </span>
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="trial-goal"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Fitness Goal
                    </label>
                    <select
                      id="trial-goal"
                      name="goal"
                      value={values.goal}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, goal: e.target.value }))
                      }
                      className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white focus:border-[#22C55E] focus:outline-none transition-colors"
                    >
                      {freeTrial.goals.map((goal) => (
                        <option key={goal} value={goal}>
                          {goal}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="trial-time"
                      className="block text-sm font-medium text-white mb-2"
                    >
                      Preferred Time
                    </label>
                    <select
                      id="trial-time"
                      name="preferredTime"
                      value={values.preferredTime}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, preferredTime: e.target.value }))
                      }
                      className="w-full rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-sm text-white focus:border-[#22C55E] focus:outline-none transition-colors"
                    >
                      {freeTrial.preferredTimes.map((timeSlot) => (
                        <option key={timeSlot} value={timeSlot}>
                          {timeSlot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-3 text-xs font-medium text-white flex items-center gap-2"
                  >
                    <span aria-hidden="true" className="text-[#22C55E]">
                      !
                    </span>
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[#22C55E] text-[#0A0A0A] font-semibold text-sm sm:text-base hover:bg-[#16A34A] disabled:opacity-70 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Booking Trial...</span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                        <span>Book Free 1-Day Trial</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-[#A3A3A3]">
                    Instant booking — Energym receives your details automatically.
                  </p>
                </div>
              </form>

              {confirmedLead && (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-6 rounded-md bg-[#1A1A1A] border border-[#22C55E] p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" aria-hidden="true" />
                      <span>Free 1-Day Trial Booked</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmedLead(null)}
                      className="text-xs font-medium text-[#A3A3A3] hover:text-white transition-colors self-start sm:self-auto cursor-pointer whitespace-nowrap"
                    >
                      Book Another Trial
                    </button>
                  </div>

                  <p className="text-xs text-[#A3A3A3] leading-relaxed">
                    Energym has received your details automatically and will reach out shortly to confirm your session.
                  </p>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-[#2A2A2A] text-xs">
                    <div>
                      <dt className="text-[#A3A3A3]">Name</dt>
                      <dd className="text-white font-medium mt-0.5">{confirmedLead.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[#A3A3A3]">Phone</dt>
                      <dd className="text-white font-medium mt-0.5 tabular-nums">
                        {confirmedLead.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#A3A3A3]">Fitness Goal</dt>
                      <dd className="text-white font-medium mt-0.5">{confirmedLead.goal}</dd>
                    </div>
                    <div>
                      <dt className="text-[#A3A3A3]">Preferred Time</dt>
                      <dd className="text-white font-medium mt-0.5">
                        {confirmedLead.preferredTime}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
