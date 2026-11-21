import { motion } from "framer-motion";

export function Emblem({ size = 32, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="em-g" x1="12" y1="4" x2="36" y2="44">
          <stop offset="0" stopColor="var(--aqua)" />
          <stop offset="1" stopColor="var(--electric)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M24 5 C24 5 11 20 11 29 a13 13 0 0 0 26 0 C37 20 24 5 24 5 Z"
        fill="url(#em-g)"
        initial={animate ? { pathLength: 0, fillOpacity: 0 } : false}
        animate={{ pathLength: 1, fillOpacity: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
        stroke="var(--aqua)"
        strokeWidth={animate ? 0.8 : 0}
      />
      <path d="M24 17 L31 31 L24 27 L17 31 Z" fill="var(--background)" opacity="0.55" />
      <ellipse cx="24" cy="30" rx="21" ry="6.5" stroke="var(--aqua)" strokeOpacity="0.7" strokeWidth="1.2" transform="rotate(-14 24 30)" />
    </svg>
  );
}

export function Wordmark({ name = "AQUACAST", sub, size = 32 }: { name?: string; sub?: string; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Emblem size={size} />
      <div className="leading-none">
        <div className="font-display text-sm font-semibold tracking-[0.28em] text-foreground">{name}</div>
        {sub && <div className="mt-1 text-[10px] tracking-wider text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

export function SatoStar({ size = 40, glow = 1 }: { size?: number; glow?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden style={{ filter: `drop-shadow(0 0 ${8 * glow}px var(--aqua))` }}>
      <defs>
        <radialGradient id="st-g">
          <stop offset="0" stopColor="var(--foreground)" />
          <stop offset="0.5" stopColor="var(--aqua)" />
          <stop offset="1" stopColor="var(--electric)" />
        </radialGradient>
      </defs>
      <path d="M24 2 C26 18 30 22 46 24 C30 26 26 30 24 46 C22 30 18 26 2 24 C18 22 22 18 24 2Z" fill="url(#st-g)" />
    </svg>
  );
}
