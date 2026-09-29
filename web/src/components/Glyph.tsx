// One line icon per hire-page category, drawn inline (viewBox 24, stroke 1.5, round joins),
// in the manner of the explorer's hire page figures. Colour comes from currentColor.
import type { Kind } from '../types';

const PATHS: Record<Kind, React.ReactNode> = {
  token: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 7.5v1.5M12 15v1.5" />
    </>
  ),
  contracts: (
    <>
      <path d="M6 3.5h8l4 4v13H6z" />
      <path d="M14 3.5v4h4" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </>
  ),
  hook: (
    <>
      <path d="M14 3v11a4.5 4.5 0 1 1-4.5-4.5" />
      <path d="M14 3h3" />
      <circle cx="14" cy="3" r="0.6" />
    </>
  ),
  report: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6.5 17V11M11 17V6M15.5 17V9M20 17V13" />
    </>
  ),
  website: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="M3 8.5h18" />
      <path d="M5.5 6.5h.01M8 6.5h.01" />
      <path d="M7 12.5h6M7 15.5h9" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <circle cx="15.5" cy="9.5" r="1.75" />
      <path d="M3.5 17l5.5-5.5 4 4 2.5-2.5 5 4.5" />
    </>
  ),
  audio: (
    <>
      <path d="M4 10v4h3l4 3.5v-11L7 10z" />
      <path d="M14.5 9.5a3.5 3.5 0 0 1 0 5M17 7a7 7 0 0 1 0 10" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="1.5" />
      <path d="M16 10l5-3v10l-5-3" />
      <path d="M8 9.5v5l4-2.5z" />
    </>
  ),
  oracle: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  heartbeat: (
    <>
      <path d="M2.5 12.5h4l2-5 3 10 2.5-7.5 1.5 2.5h6" />
    </>
  ),
  community: (
    <>
      <circle cx="12" cy="6.5" r="2.5" />
      <circle cx="5.5" cy="16.5" r="2.5" />
      <circle cx="18.5" cy="16.5" r="2.5" />
      <path d="M10 8.5l-3 5.5M14 8.5l3 5.5M8 16.5h8" />
    </>
  ),
};

export function GlyphIcon({ kind, size = 16 }: { kind: Kind; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[kind]}
    </svg>
  );
}

// The badge over card media: a button with the category name as its accessible name and
// as a tooltip on hover and keyboard focus. Activating it filters the grid to that category.
export function Glyph({ kind, onSelect }: { kind: Kind; onSelect?: (kind: Kind) => void }) {
  return (
    <span className="glyph-wrap">
      <button
        type="button"
        className={`glyph glyph-${kind}`}
        aria-label={kind}
        aria-describedby={undefined}
        onClick={() => onSelect?.(kind)}
      >
        <GlyphIcon kind={kind} />
      </button>
      <span className="glyph-tip" role="tooltip" aria-hidden="true">{kind}</span>
    </span>
  );
}
