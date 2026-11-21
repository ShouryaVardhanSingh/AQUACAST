import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { seeded } from "@/lib/rand";
import { Starfield } from "./Starfield";
import { Emblem } from "./Logo";

export function LogoReveal({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4200); return () => clearTimeout(t); }, [onDone]);
  const parts = useMemo(() => {
    const r = seeded(11);
    return Array.from({ length: 60 }, () => { const a = r() * Math.PI * 2, d = 200 + r() * 400; return { x: Math.cos(a) * d, y: Math.sin(a) * d, delay: r() * 0.8 }; });
  }, []);
  return (
    <section className="relative flex h-screen w-full cursor-pointer items-center justify-center overflow-hidden bg-background" onClick={onDone}>
      <Starfield count={220} seed={19} drift />
      <div className="absolute bottom-0 left-1/2 h-[40vh] w-[120vw] -translate-x-1/2 rounded-[50%]" style={{ background: "radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--electric) 35%, transparent), transparent 70%)" }} />
      <div className="relative flex flex-col items-center">
        <div className="relative">
          {parts.map((p, i) => (
            <motion.span key={i} className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-aqua" style={{ boxShadow: "0 0 6px var(--aqua)" }}
              initial={{ x: p.x, y: p.y, opacity: 0 }} animate={{ x: 0, y: 0, opacity: [0, 1, 0] }} transition={{ duration: 1.6, delay: p.delay, ease: "easeIn" }} />
          ))}
          <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 1.2 }}
            style={{ filter: "drop-shadow(0 0 30px var(--electric))" }}>
            <Emblem size={120} animate />
          </motion.div>
          <motion.span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-aqua"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 8], opacity: [0.8, 0] }} transition={{ delay: 2.2, duration: 1.8, ease: "easeOut" }} />
        </div>
        <motion.h1 className="mt-6 font-display text-5xl font-semibold tracking-[0.18em] text-gradient md:text-7xl"
          initial={{ opacity: 0, letterSpacing: "0.4em" }} animate={{ opacity: 1, letterSpacing: "0.18em" }} transition={{ delay: 1.8, duration: 1.4 }}>
          AQUACAST
        </motion.h1>
        <motion.p className="mt-4 text-xs tracking-[0.35em] text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6, duration: 1 }}>
          INTELLIGENCE FOR A SAFER TOMORROW
        </motion.p>
      </div>
    </section>
  );
}
