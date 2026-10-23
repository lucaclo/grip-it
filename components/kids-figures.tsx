/**
 * Boy and girl figures shown on Henry's launch screen (his request). Drawn fresh in the app's style: rounded
 * strokes, violet for the boy and orchid for the girl, each popping in a beat apart. Decorative only, and
 * still under reduced motion.
 */
export function KidsFigures({ size = 150 }: { size?: number }) {
  const limb = { strokeWidth: 8, strokeLinecap: "round" as const, stroke: "currentColor" };
  const leg = { ...limb, strokeWidth: 9 };
  return (
    <svg aria-hidden width={size * 1.2} height={size} viewBox="0 0 120 100" fill="currentColor">
      <g className="origin-center text-accent [transform-box:fill-box] motion-safe:animate-pop">
        <circle cx="32" cy="17" r="11" />
        <line x1="23" y1="39" x2="11" y2="57" {...limb} />
        <line x1="41" y1="39" x2="53" y2="57" {...limb} />
        <rect x="20" y="31" width="24" height="34" rx="9" />
        <line x1="27" y1="62" x2="27" y2="89" {...leg} />
        <line x1="37" y1="62" x2="37" y2="89" {...leg} />
      </g>
      <g className="origin-center text-accent-2 [transform-box:fill-box] motion-safe:animate-pop" style={{ animationDelay: "160ms" }}>
        <circle cx="88" cy="17" r="11" />
        <ellipse cx="74.5" cy="10" rx="6.5" ry="4" transform="rotate(-28 74.5 10)" />
        <ellipse cx="101.5" cy="10" rx="6.5" ry="4" transform="rotate(28 101.5 10)" />
        <line x1="80" y1="39" x2="68" y2="56" {...limb} />
        <line x1="96" y1="39" x2="108" y2="56" {...limb} />
        <path d="M81 31h14q4 0 5 4l7.5 30q1 4-3 4h-33q-4 0-3-4l7.5-30q1-4 5-4z" />
        <line x1="83" y1="68" x2="83" y2="89" {...leg} />
        <line x1="93" y1="68" x2="93" y2="89" {...leg} />
      </g>
    </svg>
  );
}
