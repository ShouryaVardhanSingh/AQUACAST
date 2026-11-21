import { motion } from "framer-motion";
import { ArrowRight, Mouse } from "lucide-react";
import earth from "@/assets/earth-horizon.jpg";
import { Starfield } from "./Starfield";
import { Wordmark } from "./Logo";

export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      <Starfield count={180} />
      <motion.img src={earth} alt="Earth from orbit at sunrise" width={1920} height={1088}
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ opacity: 0.15, scale: 1.08, filter: "brightness(0.25)" }}
        animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
        transition={{ duration: 4.5, ease: [0.22, 1, 0.36, 1] }} />
      {/* sun bloom */}
      <motion.div className="pointer-events-none absolute left-[65%] top-[33%] h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--sun) 55%, transparent), transparent 65%)" }}
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 0.9, y: 0 }} transition={{ duration: 5, delay: 0.8, ease: "easeOut" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--background) 85%, transparent) 0%, transparent 60%)" }} />
      {/* moon */}
      <motion.div className="animate-float absolute right-[12%] top-[16%] h-10 w-10 rounded-full"
        style={{ background: "radial-gradient(circle at 35% 35%, var(--foreground), var(--muted-foreground) 55%, var(--panel) 100%)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 2, duration: 3 }} />

      <motion.nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 1.2 }}>
        <Wordmark />
        <div className="flex gap-8 text-xs tracking-wide text-muted-foreground">
          {["About", "Features", "Impact"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="transition-colors duration-300 hover:text-aqua">{l}</a>
          ))}
        </div>
      </motion.nav>

      <div className="absolute bottom-[14%] left-6 z-10 max-w-xl md:left-16">
        <motion.h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3, duration: 1.4 }}>
          Understanding floods.<br />Seeing <span className="text-gradient">beyond</span> the surface.
        </motion.h1>
        <motion.p className="mt-5 max-w-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.6, duration: 1.2 }}>
          Satellite-powered flood intelligence for a more informed, resilient world.
        </motion.p>
        <motion.button onClick={onEnter} className="btn-aqua mt-8 px-6 py-3 text-sm font-medium"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4, duration: 1 }} whileTap={{ scale: 0.96 }}>
          Enter the Universe <ArrowRight className="h-4 w-4" />
        </motion.button>
        <motion.div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.6 }}>
          <span className="relative"><Mouse className="h-5 w-5" /><span className="animate-scroll-dot absolute left-1/2 top-1 h-1 w-0.5 -translate-x-1/2 bg-aqua" /></span> Scroll
        </motion.div>
      </div>
    </section>
  );
}
