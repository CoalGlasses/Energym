/**
 * Pure business logic, validation, and WhatsApp URL builders for Energym.
 * Kept free of DOM or asset imports so unit tests run directly in Node/tsx.
 */

export interface TrialFormValues {
  name: string;
  phone: string;
  goal: string;
  preferredTime: string;
}

export interface TrialFormErrors {
  name?: string;
  phone?: string;
  goal?: string;
  preferredTime?: string;
}

export interface ContactFormValues {
  name: string;
  phone: string;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  phone?: string;
  message?: string;
}

/**
 * Normalizes an Indian mobile number input by stripping spaces, punctuation,
 * and optional +91 / 91 / leading 0 country/trunk prefixes.
 * Returns the 10-digit Indian mobile number starting with 6-9, or "" if invalid.
 */
export function normalizeIndianPhone(input: string): string {
  const digitsOnly = input.replace(/\D/g, '');
  let tenDigits = digitsOnly;

  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    tenDigits = digitsOnly.slice(2);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    tenDigits = digitsOnly.slice(1);
  }

  if (/^[6-9]\d{9}$/.test(tenDigits)) {
    return tenDigits;
  }
  return '';
}

/**
 * Validates the 1-Day Free Trial booking form fields.
 */
export function validateTrialForm(values: TrialFormValues): TrialFormErrors {
  const errors: TrialFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }

  if (!normalizeIndianPhone(values.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }

  if (!values.goal.trim()) {
    errors.goal = 'Please select a fitness goal.';
  }

  if (!values.preferredTime.trim()) {
    errors.preferredTime = 'Please select a preferred workout time.';
  }

  return errors;
}

/**
 * Validates the Contact Us form fields.
 */
export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }

  if (!normalizeIndianPhone(values.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }

  if (values.message.trim().length < 5) {
    errors.message = 'Please enter a short message (at least 5 characters).';
  }

  return errors;
}

/**
 * Builds a properly encoded WhatsApp click-to-chat URL.
 */
export function buildWhatsAppUrl(whatsappNumberDigits: string, message: string): string {
  const cleanNumber = whatsappNumberDigits.replace(/\D/g, '');
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Formats the pre-filled WhatsApp message for the 1-day free trial request.
 */
export function formatTrialWhatsAppMessage(values: TrialFormValues, gymName = 'Energym'): string {
  const normalizedPhone = normalizeIndianPhone(values.phone) || values.phone.trim();
  return [
    `Hi ${gymName}, I would like to book my 1-Day Free Trial.`,
    `Name: ${values.name.trim()}`,
    `Phone: ${normalizedPhone}`,
    `Fitness Goal: ${values.goal.trim()}`,
    `Preferred Time: ${values.preferredTime.trim()}`,
  ].join('\n');
}

/**
 * Formats the pre-filled WhatsApp message when clicking a membership plan CTA.
 */
export function formatMembershipWhatsAppMessage(
  planName: string,
  priceInr: string,
  billingPeriod: string,
  gymName = 'Energym'
): string {
  return `Hi ${gymName}, I'm interested in joining the ${planName} plan (${priceInr} / ${billingPeriod}). Please share membership details.`;
}

/**
 * Formats the pre-filled WhatsApp message for the general contact form.
 */
export function formatContactWhatsAppMessage(
  values: ContactFormValues,
  gymName = 'Energym'
): string {
  const normalizedPhone = normalizeIndianPhone(values.phone) || values.phone.trim();
  return [
    `Hi ${gymName}, I have an enquiry.`,
    `Name: ${values.name.trim()}`,
    `Phone: ${normalizedPhone}`,
    `Message: ${values.message.trim()}`,
  ].join('\n');
}

/**
 * Formats an integer amount in Indian Rupees (e.g. 1999 -> "₹1,999").
 */
export function formatCurrencyINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Computes the next or previous gallery index with wrap-around for the lightbox.
 */
export function getNextGalleryIndex(
  currentIndex: number,
  direction: 'prev' | 'next',
  totalCount: number
): number {
  if (totalCount <= 0) {
    return 0;
  }
  if (direction === 'next') {
    return (currentIndex + 1) % totalCount;
  }
  return (currentIndex - 1 + totalCount) % totalCount;
}

export interface BrandTitlePart {
  text: string;
  isBrand: boolean;
}

/**
 * Splits a heading or title string on whole-word "Energym" (case-insensitive)
 * so UI headings can render the chiseled EnergymLogo inline.
 */
export function splitBrandTitleParts(title: string): BrandTitlePart[] {
  const segments = title.split(/\b(Energym)\b/gi);
  return segments
    .filter((segment) => segment.length > 0)
    .map((segment) => ({
      text: segment,
      isBrand: segment.toLowerCase() === 'energym',
    }));
}
