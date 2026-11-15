import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, Phone, X } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import { buildWhatsAppUrl } from '../utils/energymUtils';

const listeners = new Set<(open: boolean) => void>();

export function openCallNowModal() {
  for (const listener of listeners) {
    listener(true);
  }
}

export function CallNowModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialHintVisible, setDialHintVisible] = useState(false);
  const { business } = ENERGYM_CONFIG;

  const whatsappUrl = buildWhatsAppUrl(
    business.whatsappDigits,
    `Hi ${business.name}, please call me back regarding gym membership.`
  );

  useEffect(() => {
    listeners.add(setOpen);
    return () => {
      listeners.delete(setOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setDialHintVisible(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) {
    return null;
  }

  const handleCopyPhone = async () => {
    const numberToCopy = business.phoneDisplay;
    try {
      await navigator.clipboard.writeText(numberToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      // Fallback for embedded mobile previews where clipboard API permissions may be restricted
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = numberToCopy;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors if blocked
    }
  };

  const handleDialClick = () => {
    window.setTimeout(() => {
      setDialHintVisible(true);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Call Energym"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setOpen(false);
        }
      }}
    >
      <div className="w-full max-w-md rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-[#1A1A1A] border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-white">Call Energym</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close call dialog"
            className="w-8 h-8 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#22C55E] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4 space-y-1">
            <p className="text-xs text-[#A3A3A3]">Direct Reception Desk · Open 24×7</p>
            <p className="text-xl sm:text-2xl font-bold text-white tracking-wide tabular-nums select-all">
              +91 {business.phoneDisplay.replace(/^0/, '')}
            </p>
            <p className="text-xs text-[#A3A3A3] tabular-nums select-all">
              Local format: {business.phoneDisplay}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={business.phoneHref}
              target="_top"
              onClick={handleDialClick}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#22C55E] text-[#0A0A0A] text-sm font-semibold hover:bg-[#16A34A] transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Dial Number</span>
            </a>

            <button
              type="button"
              onClick={() => void handleCopyPhone()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-sm font-semibold text-white hover:border-[#22C55E] transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                  <span>Copy Number</span>
                </>
              )}
            </button>
          </div>

          {dialHintVisible && (
            <p className="rounded-md bg-[#1A1A1A] border border-[#22C55E]/50 px-3 py-2 text-xs text-[#A3A3A3] leading-relaxed">
              Some preview windows block direct calling. Tap <span className="text-white font-medium">Copy Number</span> above to paste into your dialer, or tap WhatsApp below.
            </p>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs font-medium text-[#A3A3A3] hover:text-white hover:border-[#22C55E] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
            <span>Request a callback on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
