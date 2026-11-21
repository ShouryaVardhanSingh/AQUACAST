import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { geoMercator, geoPath, geoCentroid, geoArea } from "d3-geo";
import { ArrowLeft, ArrowRight, Satellite } from "lucide-react";
import { countries } from "@/lib/geo";
import type { Continent } from "@/lib/continents";
import taj from "@/assets/india-taj.jpg";

const W = 1200, H = 800;

export function ContinentMap({ continent, onBack, onEnterTerra }: { continent: Continent; onBack: () => void; onEnterTerra: () => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [w, s, e, n] = continent.bbox;

  const { path, proj, inside } = useMemo(() => {
    const proj = geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], { type: "MultiPoint", coordinates: [[w, s], [e, n], [w, n], [e, s]] });
    const inside = countries.features.filter((f) => {
      const [x, y] = geoCentroid(f);
      return x >= w && x <= e && y >= s && y <= n;
    });
    return { path: geoPath(proj), proj, inside };
  }, [w, s, e, n]);
  const insideNames = new Set(inside.map((f) => f.properties.name));
  const labels = inside.filter((f) => geoArea(f) > 0.0012 || f.properties.name === "India");

  const selFeature = inside.find((f) => f.properties.name === sel);
  const zoomTo = selFeature ? proj(geoCentroid(selFeature)) : null;
  const isIndia = sel === "India";

  const enter = () => { setLeaving(true); setTimeout(onEnterTerra, 1300); };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-background">
      <motion.svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full"
        initial={{ scale: 1.6, opacity: 0, filter: "blur(12px)" }}
        animate={leaving && zoomTo ? { scale: 3, opacity: 0, x: (W / 2 - zoomTo[0]) * 1.5, y: (H / 2 - zoomTo[1]) * 1.5 } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: leaving ? 1.3 : 1.4, ease: [0.22, 1, 0.36, 1] }}>
        <defs>
          <radialGradient id="sea" cx="50%" cy="45%"><stop offset="0" stopColor="var(--ocean)" /><stop offset="1" stopColor="var(--ocean-deep)" /></radialGradient>
          <linearGradient id="landg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--land)" /><stop offset="1" stopColor="var(--land-dry)" /></linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={W} height={H} fill="url(#sea)" />
        {countries.features.map((f) => {
          const name = f.properties.name;
          const active = insideNames.has(name);
          const on = hover === name || sel === name;
          return (
            <path key={name + (f.id ?? "")} d={path(f) ?? ""}
              fill="url(#landg)" fillOpacity={active ? (on ? 0.95 : 0.7) : 0.25}
              stroke={on ? "var(--aqua)" : "var(--background)"} strokeWidth={on ? 2 : 0.6}
              filter={on ? "url(#glow)" : undefined}
              className={active ? "cursor-pointer transition-[fill-opacity] duration-300" : ""}
              onMouseEnter={active ? () => setHover(name) : undefined} onMouseLeave={active ? () => setHover(null) : undefined}
              onClick={active ? () => setSel(name) : undefined} />
          );
        })}
        {labels.map((f) => {
          const [x, y] = proj(geoCentroid(f)) ?? [0, 0];
          const name = f.properties.name;
          const on = hover === name || sel === name;
          return (
            <text key={"l" + name} x={x} y={y} textAnchor="middle" className="pointer-events-none font-display transition-all duration-300"
              fontSize={on ? 22 : name === "India" ? 18 : 13} fontWeight={on ? 600 : 500}
              fill={on ? "var(--aqua)" : "var(--foreground)"} fillOpacity={on ? 1 : 0.8} style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 3, strokeOpacity: 0.6 }}>
              {name}
            </text>
          );
        })}
      </motion.svg>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, var(--background) 100%)" }} />
      {leaving && (
        <motion.div className="pointer-events-none absolute inset-0" initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ background: "linear-gradient(100deg, transparent 30%, color-mix(in oklab, var(--aqua) 35%, transparent) 50%, transparent 70%)" }} />
      )}

      <button onClick={onBack} className="glass absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors hover:border-aqua">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="glass absolute right-6 top-6 z-10 px-4 py-2 text-xs tracking-[0.2em] text-muted-foreground">{continent.name.toUpperCase()}</div>

      <AnimatePresence mode="wait">
        {sel && !leaving && (
          <motion.aside key={sel} className="glass flow-border absolute bottom-8 right-6 z-10 w-72 p-5 md:top-1/2 md:bottom-auto md:-translate-y-1/2"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.4 }}>
            <h2 className="font-display text-3xl font-semibold">{isIndia ? "INDIA" : sel}</h2>
            <p className="text-sm text-muted-foreground">{isIndia ? "South Asia" : continent.name}</p>
            {isIndia ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">A region of great diversity and resilience.</p>
                <img src={taj} alt="Taj Mahal reflected at dawn" loading="lazy" width={768} height={512} className="mt-4 aspect-[3/2] w-full rounded-md object-cover" />
                <button onClick={enter} className="btn-aqua mt-5 px-5 py-2.5 text-sm font-medium">Enter TERRA <ArrowRight className="h-4 w-4" /></button>
              </>
            ) : (
              <div className="mt-4 rounded-md border border-border bg-panel/60 p-4">
                <Satellite className="h-5 w-5 text-aqua" />
                <p className="mt-2 font-display text-sm font-semibold">Coverage coming soon</p>
                <p className="mt-1 text-xs text-muted-foreground">Flood intelligence for {sel} isn't available in this prototype yet. India is currently the only covered country.</p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
      {!sel && (
        <p className="glass absolute bottom-8 left-1/2 z-10 -translate-x-1/2 px-4 py-2 text-xs text-muted-foreground">Select a country{continent.id === "as" ? " — try India" : ""}</p>
      )}
    </section>
  );
}
