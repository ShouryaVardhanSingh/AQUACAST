import { motion } from "framer-motion";
import { useState } from "react";
import { CONTINENTS, type ContinentId } from "@/lib/continents";
import { Starfield, Particles } from "./Starfield";
import { Wordmark } from "./Logo";
import { Globe } from "./Globe";

export function PlanetSelect({ onSelect }: { onSelect: (id: ContinentId) => void }) {
  const [hover, setHover] = useState<ContinentId | null>(null);
  const [picked, setPicked] = useState<ContinentId | null>(null);
  const base = 190;
  const pick = (id: ContinentId) => { if (picked) return; setPicked(id); setTimeout(() => onSelect(id), 1100); };
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background py-24">
      <Starfield count={200} seed={23} drift />
      <Particles count={30} />
      <div className="absolute left-6 top-6 z-10 md:left-10"><Wordmark /></div>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[55vh] w-[90vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-aqua/15" style={{ transform: "translate(-50%,-50%) rotateX(70deg)" }} />
      <motion.div className="relative z-10 grid grid-cols-2 gap-x-10 gap-y-8 md:grid-cols-3 md:gap-x-20"
        initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
        {CONTINENTS.map((c, i) => {
          const isPicked = picked === c.id;
          const faded = (picked && !isPicked) || (hover && hover !== c.id && !picked);
          const size = Math.round(base * c.size);
          return (
            <motion.button key={c.id} type="button" aria-label={`Select ${c.name}`}
              className="relative flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-aqua"
              style={{ animation: `float-y ${6 + i}s ease-in-out ${i * 0.4}s infinite` }}
              variants={{ hidden: { opacity: 0, scale: 0.7 }, show: { opacity: 1, scale: 1 } }}
              animate={isPicked ? { scale: 4, opacity: 0, zIndex: 20 } : { opacity: picked ? 0 : faded ? 0.45 : 1, scale: hover === c.id ? 1.08 : 1 }}
              transition={{ duration: isPicked ? 1.1 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} onClick={() => pick(c.id)}>
              <div className="transition-[filter] duration-500" style={{ filter: hover === c.id ? "brightness(1.3) drop-shadow(0 0 22px var(--aqua))" : "brightness(0.95)" }}>
                <Globe center={c.center} size={size} id={c.id} />
              </div>
              <span className="pointer-events-none absolute max-w-[70%] text-center font-display text-base font-semibold leading-tight transition-all duration-500 md:text-lg"
                style={{ textShadow: "0 2px 10px var(--background), 0 0 2px var(--background)", opacity: hover === c.id ? 1 : 0.85 }}>
                {c.name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
      <motion.p className="relative z-10 mt-12 text-sm tracking-wide text-foreground/90" initial={{ opacity: 0 }} animate={{ opacity: picked ? 0 : 1 }} transition={{ delay: 0.8 }}>
        Select a Continent
      </motion.p>
    </section>
  );
}
