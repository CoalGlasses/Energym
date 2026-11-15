import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import { EnergymLogo } from './EnergymLogo';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#home"
          className="inline-flex items-center whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <EnergymLogo className="h-5 sm:h-7 w-auto" />
        </a>

        {/* Zone 2: Desktop Navigation Links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {ENERGYM_CONFIG.navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#A3A3A3] hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#22C55E]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary CTA + Mobile Hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#trial"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#22C55E] text-[#0A0A0A] text-sm font-semibold hover:bg-[#16A34A] transition-colors whitespace-nowrap shrink-0"
          >
            Free Trial
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-[#2A2A2A] bg-[#1A1A1A] text-white hover:border-[#22C55E] transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="md:hidden bg-[#1A1A1A] border-t border-[#2A2A2A] px-4 py-4"
        >
          <div className="flex flex-col gap-1">
            {ENERGYM_CONFIG.navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className="px-3 py-3 rounded-lg text-base font-medium text-white hover:bg-[#2A2A2A] transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#trial"
              onClick={handleLinkClick}
              className="mt-2 inline-flex items-center justify-center px-4 py-3 rounded-lg bg-[#22C55E] text-[#0A0A0A] text-base font-semibold hover:bg-[#16A34A] transition-colors"
            >
              Free Trial
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
