import type { SVGProps } from "react";

/** Grip It's own glyph: a barbell side-on with two plates a side. Drawn on Lucide's 24px grid so it sits with them. */
export function BarbellIcon({ strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1.5 12h21" />
      <rect x="4.5" y="5" width="3" height="14" rx="1.2" />
      <rect x="8.5" y="7.5" width="2" height="9" rx="1" />
      <rect x="16.5" y="5" width="3" height="14" rx="1.2" />
      <rect x="13.5" y="7.5" width="2" height="9" rx="1" />
    </svg>
  );
}
