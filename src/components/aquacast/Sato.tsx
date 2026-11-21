import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { demoReply } from "@/lib/flood";
import { SatoStar } from "./Logo";
import { Particles } from "./Starfield";
import { IndiaMap } from "./IndiaMap";

type Msg = { role: "user" | "sato"; text: string; map?: boolean };
const CHIPS = ["Which regions are most affected?", "Compare affected regions.", "Explain the flood severity levels.", "What does the forecast indicate?"];

export function Sato({ initial, onBack }: { initial: string; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const send = (text: string) => {
    if (!text.trim() || typing) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    // Simulated response — swap for a real API call later.
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "sato", text: demoReply(text), map: /affected|forecast/i.test(text) }]);
    }, 1400);
  };
  useEffect(() => { if (!started.current && initial) { started.current = true; send(initial); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing]);

  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden" style={{ background: "radial-gradient(ellipse at 50% 0%, var(--panel), var(--navy) 45%, var(--background))" }}>
      <Particles count={50} seed={77} />
      <svg className="pointer-events-none absolute bottom-0 left-0 h-48 w-[200%] opacity-30" viewBox="0 0 2000 200" preserveAspectRatio="none" style={{ animation: "wave-move 30s linear infinite" }} aria-hidden>
        <path d="M0 120 Q250 60 500 120 T1000 120 T1500 120 T2000 120 V200 H0Z" fill="var(--electric)" fillOpacity="0.18" />
        <path d="M0 150 Q250 100 500 150 T1000 150 T1500 150 T2000 150" fill="none" stroke="var(--aqua)" strokeOpacity="0.5" />
      </svg>
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vmin] w-[60vmin] -translate-x-1/2 rounded-full border border-aqua/10" />

      <header className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <motion.div initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }}><SatoStar size={48} glow={1.6} /></motion.div>
          <div><h1 className="font-display text-xl font-semibold tracking-wide">SATO</h1><p className="text-xs text-muted-foreground">Flood Intelligence Companion · demo responses</p></div>
        </div>
        <button onClick={onBack} className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors hover:border-aqua"><ArrowLeft className="h-4 w-4" /> Back to TERRA</button>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-4xl flex-1 space-y-4 overflow-y-auto px-6 pb-4">
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "sato" && <div className="mt-1"><SatoStar size={26} /></div>}
              <div className={m.role === "user" ? "max-w-md rounded-2xl rounded-br-sm border border-aqua/50 bg-electric/25 px-4 py-2.5 text-sm" : "glass max-w-lg whitespace-pre-line px-4 py-3 text-sm leading-relaxed"}>
                {m.text}
                {m.map && <div className="mt-3 h-40 w-36 overflow-hidden rounded-md border border-border bg-background/60"><IndiaMap layer="risk" compact /></div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex items-center gap-3"><SatoStar size={26} />
            <div className="glass flex gap-1.5 px-4 py-3">{[0, 1, 2].map((d) => <motion.span key={d} className="h-2 w-2 rounded-full bg-aqua" animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.15 }} />)}</div>
          </div>
        )}
        <div ref={end} />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => <button key={c} onClick={() => send(c)} className="glass rounded-full px-3 py-1.5 text-xs transition-all hover:border-aqua hover:text-aqua">{c}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass flex items-center gap-2 rounded-full py-1.5 pl-5 pr-1.5">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask SATO anything..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button type="submit" aria-label="Send" className="btn-aqua h-9 w-9 justify-center p-0"><ArrowRight className="h-4 w-4" /></button>
        </form>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">SATO is a prototype with pre-written answers — not connected to a real AI. All data is illustrative.</p>
      </div>
    </section>
  );
}
