import { splitBrandTitleParts } from '../utils/energymUtils';

interface EnergymLogoProps {
  className?: string;
}

const ALL_LETTER_PATHS = [
  // E
  'M4,4 H58 V20 H22 V31 H50 V47 H22 V58 H58 V74 H4 Z',
  // N
  'M70,4 H88 L112,44 V4 H128 V74 H110 L86,34 V74 H70 Z',
  // E
  'M140,4 H194 V20 H158 V31 H186 V47 H158 V58 H194 V74 H140 Z',
  // R (with inner counter cutout)
  'M206,4 H254 L264,14 V34 L254,44 H244 L264,74 H244 L226,46 H222 V74 H206 Z M222,19 V31 H246 V19 Z',
  // G
  'M286,4 H334 V20 H292 V58 H318 V44 H304 V31 H334 V74 H286 L276,64 V14 Z',
  // Y
  'M346,4 H364 L375,30 L386,4 H404 L384,44 V74 H366 V44 Z',
  // M
  'M416,4 H434 L447,26 L460,4 H478 V74 H461 V32 L447,52 L433,32 V74 H416 Z',
];

const TOP_HIGHLIGHTS = [
  // Subtle crisp top bevel bars matching the site's clean flat aesthetic
  'M4,4 H58 V9 H4 Z',
  'M70,4 H88 V9 H70 Z M112,4 H128 V9 H112 Z',
  'M140,4 H194 V9 H140 Z',
  'M206,4 H254 V9 H206 Z',
  'M286,4 H334 V9 H286 Z',
  'M346,4 H364 V9 H346 Z M386,4 H404 V9 H386 Z',
  'M416,4 H434 V9 H416 Z M460,4 H478 V9 H460 Z',
];

/**
 * Clean, matte stone-grey Minecraft-title-style SVG wordmark for ENERGYM,
 * tuned to blend directly with the #0A0A0A / #2A2A2A / #A3A3A3 / #22C55E UI.
 */
export function EnergymLogo({ className = 'h-7 w-auto' }: EnergymLogoProps) {
  return (
    <span className="inline-flex items-center">
      <span className="sr-only">ENERGYM</span>
      <svg
        viewBox="0 0 484 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={className}
      >
        {/* Flat architectural 3D extrusion matching card border grey (#2A2A2A) */}
        <g transform="translate(0, 7)" stroke="#0A0A0A" strokeWidth="4" strokeLinejoin="miter">
          {ALL_LETTER_PATHS.map((d, idx) => (
            <path key={`stone-ext-${idx}`} d={d} fill="#2A2A2A" fillRule="evenodd" />
          ))}
        </g>

        {/* Crisp #0A0A0A contour */}
        <g stroke="#0A0A0A" strokeWidth="4" strokeLinejoin="miter">
          {ALL_LETTER_PATHS.map((d, idx) => (
            <path key={`stone-border-${idx}`} d={d} fill="#0A0A0A" fillRule="evenodd" />
          ))}
        </g>

        {/* Clean matte stone-grey letter faces */}
        <g>
          {ALL_LETTER_PATHS.map((d, idx) => (
            <path key={`stone-face-${idx}`} d={d} fill="#A3A3A3" fillRule="evenodd" />
          ))}
        </g>

        {/* Crisp flat light-grey top edge bevel */}
        <g fill="#D4D4D4">
          {TOP_HIGHLIGHTS.map((d, idx) => (
            <path key={`stone-hi-${idx}`} d={d} />
          ))}
        </g>
      </svg>
    </span>
  );
}

interface BrandTitleProps {
  text: string;
  logoClassName?: string;
}

/**
 * Renders title text with any occurrence of "Energym" styled using EnergymLogo.
 */
export function BrandTitle({
  text,
  logoClassName = 'h-[0.94em] w-auto translate-y-[0.11em] mx-[0.06em]',
}: BrandTitleProps) {
  const parts = splitBrandTitleParts(text);

  return (
    <>
      {parts.map((part, index) =>
        part.isBrand ? (
          <EnergymLogo key={`brand-${index}`} className={logoClassName} />
        ) : (
          <span key={`text-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}
