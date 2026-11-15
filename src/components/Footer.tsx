import { useState } from 'react';
import { Facebook, Instagram, Phone } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import { EnergymLogo } from './EnergymLogo';
import { OwnerPortalModal } from './OwnerPortalModal';

export function Footer() {
  const { business, navigation, socialLinks } = ENERGYM_CONFIG;
  const [ownerPortalOpen, setOwnerPortalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes('owner=1') || window.location.hash === '#owner';
  });

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A] pt-10 sm:pt-14 pb-20 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-[#2A2A2A]">
          {/* Brand & Tagline */}
          <div className="md:col-span-5 space-y-3">
            <a
              href="#home"
              className="inline-flex items-center hover:opacity-90 transition-opacity"
            >
              <EnergymLogo className="h-8 w-auto" />
            </a>
            <p className="text-sm text-[#A3A3A3] leading-relaxed max-w-sm">
              {business.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-[#A3A3A3] hover:text-[#22C55E] transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Reach Us</h3>
            <p className="text-sm text-[#A3A3A3] leading-relaxed">{business.address}</p>
            <a
              href={business.phoneHref}
              target="_top"
              className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#22C55E] transition-colors tabular-nums"
            >
              <Phone className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
              <span>{business.phoneDisplay}</span>
            </a>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Energym on Instagram"
                className="w-10 h-10 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-[#22C55E] hover:border-[#22C55E] transition-colors"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Energym on Facebook"
                className="w-10 h-10 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] hover:text-[#22C55E] hover:border-[#22C55E] transition-colors"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A3A3A3]">
          <p>{business.copyrightText}</p>
          <div className="flex items-center gap-4">
            <p>{business.shortLocation}</p>
            <button
              type="button"
              onClick={() => setOwnerPortalOpen(true)}
              className="text-xs text-[#A3A3A3] hover:text-[#22C55E] transition-colors cursor-pointer whitespace-nowrap"
            >
              Owner Portal
            </button>
          </div>
        </div>
      </div>

      <OwnerPortalModal
        open={ownerPortalOpen}
        onClose={() => setOwnerPortalOpen(false)}
      />
    </footer>
  );
}
