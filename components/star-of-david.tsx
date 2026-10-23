/**
 * Star of David shown on Charlie's launch screen (their request). Two interlocking triangles drawn in the
 * accent colour; decorative only, and it stays still under reduced motion.
 */
export function StarOfDavid({ size = 150 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="text-accent motion-safe:animate-pop"
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinejoin="round"
    >
      <polygon points="50,8 86.4,71 13.6,71" />
      <polygon points="50,92 13.6,29 86.4,29" />
    </svg>
  );
}

