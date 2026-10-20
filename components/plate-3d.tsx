/**
 * Ambient 3D bumper plate with orbiting spheres: Grip It's hero object. Pure CSS 3D (stacked layers give
 * the plate real thickness). Decorative only; it stops moving under reduced motion.
 */
export function Plate3D({ size = 120, className = "" }: { size?: number; className?: string }) {
  const depth = 18; // px of plate thickness
  const layers = 12;
  return (
    <div aria-hidden className={`pointer-events-none ${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} ${className}`} style={{ width: size, height: size, perspective: size * 6 }}>
      <div className="absolute inset-0 motion-safe:animate-[bob_6s_ease-in-out_infinite]" style={{ transformStyle: "preserve-3d" }}>
        <div
          className="absolute inset-0 motion-safe:animate-[plate-turn_12s_ease-in-out_infinite]"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(14deg) rotateY(-28deg)" }}
        >
          {/* edge: stacked discs */}
          {Array.from({ length: layers }, (_, i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                transform: `translateZ(${-depth / 2 + (i * depth) / (layers - 1)}px)`,
                background: `linear-gradient(135deg, #3a2a72, #1c1440 60%, #2a1f55)`,
              }}
            />
          ))}
          {/* front face */}
          <span
            className="absolute inset-0 grid place-items-center rounded-full"
            style={{
              transform: `translateZ(${depth / 2 + 0.5}px)`,
              background:
                "radial-gradient(120% 120% at 30% 20%, #cdb8ff 0%, #9d7bff 28%, #6b45e6 55%, #3b2391 80%, #24165e 100%)",
              boxShadow: "inset 0 0 0 3px rgb(255 255 255 / 0.18), inset 0 -10px 24px rgb(0 0 0 / 0.35)",
            }}
          >
            <span
              className="absolute rounded-full"
              style={{ inset: "16%", boxShadow: "inset 0 0 0 2px rgb(255 255 255 / 0.22), 0 0 0 2px rgb(0 0 0 / 0.15)" }}
            />
            <span
              className="absolute rounded-full"
              style={{
                inset: "40%",
                background: "radial-gradient(circle at 35% 30%, #f6f4fb, #9a94b0 60%, #4b4560)",
                boxShadow: "0 0 0 3px rgb(0 0 0 / 0.25)",
              }}
            />
            <span
              className="absolute font-display font-bold tracking-[0.2em] text-white/80"
              style={{ fontSize: size * 0.085, top: "22%" }}
            >
              GRIP IT
            </span>
            <span className="absolute font-display font-bold text-white/70" style={{ fontSize: size * 0.08, bottom: "20%" }}>
              20 KG
            </span>
            {/* gloss */}
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(160deg, rgb(255 255 255 / 0.45) 0%, rgb(255 255 255 / 0) 35%)" }}
            />
          </span>
          {/* back face */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              transform: `rotateY(180deg) translateZ(${depth / 2 + 0.5}px)`,
              background: "radial-gradient(circle at 60% 30%, #8a6bff, #3b2391 70%)",
            }}
          />
        </div>

        {/* orbiting spheres */}
        <div
          className="absolute inset-[-28%] motion-safe:animate-[orbit_7s_linear_infinite]"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(68deg)" }}
        >
          <Sphere color="#d4ff3a" glow="rgb(212 255 58 / 0.6)" at="top" size={size * 0.13} />
          <Sphere color="#e58bff" glow="rgb(229 139 255 / 0.6)" at="bottom" size={size * 0.1} />
        </div>
      </div>
      {/* soft floor shadow */}
      <span
        className="absolute left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-full bg-black/50 blur-md"
        style={{ bottom: -size * 0.12 }}
      />
    </div>
  );
}

function Sphere({ color, glow, at, size }: { color: string; glow: string; at: "top" | "bottom"; size: number }) {
  return (
    <span
      className="absolute left-1/2 -ml-[var(--s)] motion-safe:animate-[counter-orbit_7s_linear_infinite]"
      style={
        {
          "--s": `${size / 2}px`,
          width: size,
          height: size,
          [at]: 0,
          transformStyle: "preserve-3d",
        } as React.CSSProperties
      }
    >
      <span
        className="block size-full rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${color} 38%, ${color} 60%, rgb(0 0 0 / 0.55) 100%)`,
          boxShadow: `0 0 ${size}px ${glow}`,
        }}
      />
    </span>
  );
}
