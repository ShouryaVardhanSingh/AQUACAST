import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Database, ShieldAlert, Sparkles } from "lucide-react";
import { analyzeSatoQuery, type SatoResponse } from "@/lib/sato-engine";
import { snapshotManager, type FloodSnapshot } from "@/lib/flood";
import { SatoStar } from "./Logo";
import { Particles } from "./Starfield";
import { IndiaMap } from "./IndiaMap";

interface Msg {
  role: "user" | "sato";
  text: string;
  responseMeta?: SatoResponse;
}

const DEFAULT_CHIPS = [
  "Which regions are most affected?",
  "Compare Assam and Bihar.",
  "Explain the flood severity levels.",
  "What does the 72-hour forecast indicate?",
];

export function Sato({ initial, onBack }: { initial: string; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<FloodSnapshot>(() => snapshotManager.getSnapshot());
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    return snapshotManager.subscribe((snap) => {
      setSnapshot(snap);
    });
  }, []);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    const cleanText = text.trim();
    setMsgs((m) => [...m, { role: "user", text: cleanText }]);
    setInput("");
    setTyping(true);

    // Context-grounded analysis reading the active snapshot
    setTimeout(() => {
      const response = analyzeSatoQuery(cleanText, snapshot);
      setTyping(false);
      setMsgs((m) => [...m, { role: "sato", text: response.text, responseMeta: response }]);
      if (response.suggestedFollowUps && response.suggestedFollowUps.length > 0) {
        setChips(response.suggestedFollowUps);
      }
    }, 700);
  };

  useEffect(() => {
    if (!started.current && initial) {
      started.current = true;
      send(initial);
    }
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  return (
    <section
      className="relative flex h-screen w-full flex-col overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, var(--panel), var(--navy) 45%, var(--background))" }}
    >
      <Particles count={50} seed={77} />
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-48 w-[200%] opacity-30"
        viewBox="0 0 2000 200"
        preserveAspectRatio="none"
        style={{ animation: "wave-move 30s linear infinite" }}
        aria-hidden
      >
        <path d="M0 120 Q250 60 500 120 T1000 120 T1500 120 T2000 120 V200 H0Z" fill="var(--electric)" fillOpacity="0.18" />
        <path d="M0 150 Q250 100 500 150 T1000 150 T1500 150 T2000 150" fill="none" stroke="var(--aqua)" strokeOpacity="0.5" />
      </svg>
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vmin] w-[60vmin] -translate-x-1/2 rounded-full border border-aqua/10" />

      {/* HEADER */}
      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
            <SatoStar size={42} glow={1.6} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-semibold tracking-wide">SATO</h1>
              <span className="rounded-full border border-aqua/30 bg-electric/20 px-2 py-0.5 text-[9px] uppercase tracking-wider text-aqua font-medium">
                Grounded Assistant
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Database className="h-3 w-3 text-aqua" />
              <span>Snapshot: {snapshot.title} ({snapshot.observationDate})</span>
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm transition-colors hover:border-aqua"
        >
          <ArrowLeft className="h-4 w-4" /> Back to TERRA
        </button>
      </header>

      {/* CHAT MESSAGES CONTAINER */}
      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 space-y-4 overflow-y-auto px-4 pb-4 md:px-6">
        {msgs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mx-auto my-8 max-w-xl p-5 text-center"
          >
            <SatoStar size={36} className="mx-auto mb-3" />
            <h2 className="font-display text-base font-semibold">Welcome to SATO Intelligence</h2>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              I am grounded directly in AQUACAST's active <strong>{snapshot.title}</strong> snapshot. Ask me about state-by-state flood extents, river basin discharge levels, population exposure, or 72-hour forecasts.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-panel-2 px-3 py-1 text-[10px] text-muted-foreground">
              <ShieldAlert className="h-3 w-3 text-aqua" /> Verified CWC & GloFAS Benchmark Data · No Fabricated Telemetry
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "sato" && (
                <div className="mt-1 shrink-0">
                  <SatoStar size={26} />
                </div>
              )}
              <div
                className={
                  m.role === "user"
                    ? "max-w-md rounded-2xl rounded-br-sm border border-aqua/50 bg-electric/25 px-4 py-2.5 text-sm leading-relaxed"
                    : "glass max-w-xl px-4 py-3 text-sm leading-relaxed"
                }
              >
                <div className="whitespace-pre-line text-foreground/95">{m.text}</div>

                {m.responseMeta?.showMap && (
                  <div className="mt-3.5 flex flex-col items-center sm:flex-row sm:items-start gap-3 rounded-lg border border-border/80 bg-background/50 p-2.5">
                    <div className="h-36 w-36 overflow-hidden rounded-md border border-border/50 bg-navy shrink-0">
                      <IndiaMap
                        layer={m.responseMeta.mapLayer}
                        compact
                        selected={m.responseMeta.selectedState}
                        snapshot={snapshot}
                      />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-display font-semibold text-aqua flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" /> Synchronized Map View
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Layer: <strong>{m.responseMeta.mapLayer.toUpperCase()}</strong>
                        {m.responseMeta.selectedState ? ` · Highlight: ${m.responseMeta.selectedState}` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground/75 leading-tight">
                        Driven by current snapshot metrics. Return to TERRA for full pan and state inspection.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <div className="flex items-center gap-3">
            <SatoStar size={26} />
            <div className="glass flex gap-1.5 px-4 py-3">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="h-2 w-2 rounded-full bg-aqua"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: d * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      {/* FOOTER & PROMPTS */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-4 md:px-6 md:pb-6">
        <div className="mb-2.5 flex flex-wrap gap-1.5 md:gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => send(c)}
              className="glass rounded-full px-3 py-1.5 text-xs transition-all hover:border-aqua hover:text-aqua"
            >
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass flex items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask SATO anything about ${snapshot.title}...`}
            className="flex-1 bg-transparent text-xs md:text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" aria-label="Send" className="btn-aqua h-8 w-8 md:h-9 md:w-9 justify-center p-0">
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          SATO evaluates verified observational data and hydrological models · Never extrapolates ungrounded statistics.
        </p>
      </div>
    </section>
  );
}
