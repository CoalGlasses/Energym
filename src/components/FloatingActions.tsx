import { MessageCircle, Phone } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import { buildWhatsAppUrl } from '../utils/energymUtils';
import { openCallNowModal } from './CallNowModal';

export function FloatingActions() {
  const { business } = ENERGYM_CONFIG;
  const whatsappUrl = buildWhatsAppUrl(
    business.whatsappDigits,
    `Hi ${business.name}, I would like to book a free trial or enquire about membership.`
  );

  return (
    <>
      {/* Desktop / Tablet Floating WhatsApp Button (bottom-right) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Energym on WhatsApp"
        className="hidden md:inline-flex fixed bottom-6 right-6 z-40 items-center gap-2.5 px-4 py-3 rounded-md bg-[#22C55E] text-[#0A0A0A] font-semibold text-sm shadow-lg hover:bg-[#16A34A] transition-colors"
      >
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        <span>WhatsApp</span>
      </a>

      {/* Mobile Bottom Action Bar (Call Now + WhatsApp, compact height <= 56px) */}
      <div
        aria-label="Quick contact actions"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#2A2A2A] px-3 flex items-center gap-2.5"
      >
        <button
          type="button"
          onClick={openCallNowModal}
          className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-md border border-[#2A2A2A] bg-[#1A1A1A] text-white text-sm font-semibold hover:border-[#22C55E] transition-colors cursor-pointer"
        >
          <Phone className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
          <span>Call Now</span>
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-md bg-[#22C55E] text-[#0A0A0A] text-sm font-semibold hover:bg-[#16A34A] transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      </div>
    </>
  );
}
