import { useMemo } from "react";
import { seeded } from "@/lib/rand";

export function Starfield({ count = 160, seed = 7, drift = false }: { count?: number; seed?: number; drift?: boolean }) {
  const stars = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({
      x: r() * 100, y: r() * 100, s: r() < 0.9 ? 1 : 2, d: r() * 5, o: 0.3 + r() * 0.7,
    }));
  }, [count, seed]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -inset-[10%]" style={drift ? { animation: "drift 80s linear infinite alternate" } : undefined}>
        {stars.map((st, i) => (
          <span key={i} className="animate-twinkle absolute rounded-full bg-foreground"
            style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, opacity: st.o, animationDelay: `${st.d}s` }} />
        ))}
      </div>
    </div>
  );
}

export function Particles({ count = 40, seed = 3 }: { count?: number; seed?: number }) {
  const ps = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ x: r() * 100, y: r() * 100, s: 2 + r() * 3, d: 14 + r() * 20, delay: -r() * 20 }));
  }, [count, seed]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {ps.map((p, i) => (
        <span key={i} className="absolute rounded-full bg-aqua"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, opacity: 0.45, boxShadow: "0 0 8px var(--aqua)",
            animation: `drift ${p.d}s linear ${p.delay}s infinite alternate` }} />
      ))}
    </div>
  );
}

export function Ripple({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  return (
    <div key={trigger} className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden>
      {[0, 0.15, 0.3].map((d) => (
        <span key={d} className="absolute rounded-full border border-aqua"
          style={{ width: 40, height: 40, animation: `ripple-out 1.4s ease-out ${d}s forwards`, opacity: 0 }} />
      ))}
      <style>{`@keyframes ripple-out{0%{transform:scale(1);opacity:.8}100%{transform:scale(40);opacity:0}}`}</style>
    </div>
  );
}
