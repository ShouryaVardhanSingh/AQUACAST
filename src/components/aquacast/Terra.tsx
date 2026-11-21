import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, ShieldCheck, Triangle, Settings, User, ArrowRight, Sparkles, Globe2, Clock } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AFFECTED, FORECAST, TREND, SEV_COLOR, getState } from "@/lib/flood";
import { Wordmark, SatoStar } from "./Logo";
import { Particles } from "./Starfield";
import { IndiaMap, type Layer } from "./IndiaMap";

const TABS = ["Overview", "Risk Analysis", "Forecast", "Reports"];
const LAYERS: { id: Layer; label: string }[] = [{ id: "risk", label: "Risk Map" }, { id: "impact", label: "Impact" }, { id: "forecast", label: "Forecast" }];

function Panel({ title, badge, children, className = "" }: { title: string; badge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={`glass p-4 ${className}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-sm font-semibold">{title}</h3>{badge}</div>
      {children}
    </motion.div>
  );
}
const Demo = () => <span className="rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">Illustrative</span>;

export function Terra({ onAskSato }: { onAskSato: (q: string) => void }) {
  const [tab, setTab] = useState("Overview");
  const [layer, setLayer] = useState<Layer>("risk");
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("Which regions are most affected?");
  const [portal, setPortal] = useState(false);
  const selData = sel ? getState(sel) : null;

  const ask = (e: React.FormEvent) => { e.preventDefault(); if (!q.trim()) return; setPortal(true); setTimeout(() => onAskSato(q.trim()), 1400); };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background p-3 md:p-4" style={{ background: "radial-gradient(ellipse at 50% 40%, var(--navy), var(--background) 70%)" }}>
      <Particles count={24} seed={41} />
      <motion.div animate={portal ? { opacity: 0.25, filter: "blur(4px)" } : { opacity: 1 }} transition={{ duration: 1 }} className="relative">
        <header className="glass mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <Wordmark name="TERRA" sub="Flood Intelligence" />
          <nav className="flex gap-1 text-xs">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className="relative rounded-full px-4 py-2 transition-colors hover:text-aqua">
                {tab === t && <motion.span layoutId="tab" className="absolute inset-0 rounded-full border border-aqua/60 bg-electric/20" style={{ boxShadow: "var(--glow-aqua)" }} />}
                <span className="relative">{t}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5"><Globe2 className="h-3.5 w-3.5 text-aqua" /> India</span>
            <Settings className="h-4 w-4" /><User className="h-4 w-4" />
          </div>
        </header>

        <div className="grid gap-3 lg:grid-cols-[300px_1fr_320px]">
          {/* LEFT */}
          <div className="space-y-3">
            <Panel title="India Flood Overview" badge={<Demo />}>
              {[
                { icon: AlertTriangle, v: "12.4k km²", l: "Severely affected", c: "var(--severe)" },
                { icon: Triangle, v: "8.7k km²", l: "Moderately affected", c: "var(--moderate)" },
                { icon: ShieldCheck, v: "72.3%", l: "Low / no significant impact", c: "var(--low)" },
              ].map(({ icon: I, v, l, c }, i) => (
                <motion.div key={l} className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                  <I className="h-6 w-6" style={{ color: c, filter: `drop-shadow(0 0 6px ${c})` }} />
                  <div><div className="font-display text-xl font-semibold" style={{ color: i === 0 ? c : undefined }}>{v}</div><div className="text-[11px] text-muted-foreground">{l}</div></div>
                </motion.div>
              ))}
            </Panel>
            <Panel title="Affected States" badge={<Demo />}>
              <ul className="max-h-48 space-y-0.5 overflow-auto pr-1 text-xs">
                {AFFECTED.map((s) => (
                  <li key={s.name}>
                    <button onClick={() => setSel(s.name)} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-panel-2 ${sel === s.name ? "bg-panel-2 text-aqua" : ""}`}>
                      <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[s.severity] }} />
                      <span className="flex-1 text-left">{s.name}</span>
                      <span className="text-muted-foreground">{s.area.toLocaleString()} km²</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Flood Trend (Last 7 Days)" badge={<span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] text-aqua">+24%</span>}>
              <div className="h-32">
                <ResponsiveContainer>
                  <AreaChart data={TREND} margin={{ left: -24, right: 4, top: 4 }}>
                    <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--aqua)" stopOpacity={0.5} /><stop offset="1" stopColor="var(--electric)" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--navy)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}k km²`, "Flooded area"]} />
                    <Area type="monotone" dataKey="area" stroke="var(--aqua)" strokeWidth={2} fill="url(#tg)" isAnimationActive={false} dot={{ r: 2, fill: "var(--aqua)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" /> Demo observation · Nov 21, 2026 · illustrative values</p>
            </Panel>
          </div>

          {/* CENTER */}
          <motion.div className="glass flow-border relative min-h-[560px] overflow-hidden lg:min-h-0" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <div className="absolute inset-0 pb-14"><IndiaMap layer={layer} selected={sel} onSelect={setSel} /></div>
            {sel && selData && (
              <div className="glass absolute bottom-16 left-3 px-3 py-2 text-xs">
                <span className="font-display font-semibold">{sel}</span>
                <span className="ml-2 text-muted-foreground">{selData.area ? `${selData.area.toLocaleString()} km² (illustrative)` : "No significant impact in demo data"}</span>
              </div>
            )}
            <div className="glass absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full p-1 text-xs">
              {LAYERS.map((l) => (
                <button key={l.id} onClick={() => setLayer(l.id)} className="relative rounded-full px-4 py-1.5">
                  {layer === l.id && <motion.span layoutId="layer" className="absolute inset-0 rounded-full bg-electric/40" style={{ boxShadow: "var(--glow-aqua)" }} />}
                  <span className="relative">{l.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* RIGHT */}
          <div className="space-y-3">
            <Panel title="Flood Forecast" badge={<span className="rounded-full bg-electric/30 px-2 py-0.5 text-[10px] text-aqua">AI Prediction · Demo</span>}>
              <p className="-mt-2 mb-2 text-[11px] text-muted-foreground">Simulated areas at risk in the next 72 hours</p>
              {FORECAST.map((f) => (
                <div key={f.region} className="flex items-center gap-2 py-1.5 text-xs">
                  <AlertTriangle className="h-4 w-4" style={{ color: SEV_COLOR[f.sev] }} />
                  <span className="flex-1">{f.region}</span>
                  <span className="rounded px-2 py-0.5 text-[10px]" style={{ color: SEV_COLOR[f.sev], background: `color-mix(in oklab, ${SEV_COLOR[f.sev]} 18%, transparent)` }}>{f.level}</span>
                </div>
              ))}
              <div className="mt-2 h-28 overflow-hidden rounded-md border border-border bg-navy"><IndiaMap layer="forecast" compact /></div>
            </Panel>
            <Panel title="Key Insights" badge={<Demo />}>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {["Closer monitoring suggested for Assam and Bihar.", "Observed change: affected area up 24% over 7 days.", "Uttar Pradesh trends from moderate toward high.", "No major exposure indicated across southern India."].map((t) => (
                  <li key={t} className="flex gap-2"><Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-aqua" />{t}</li>
                ))}
              </ul>
            </Panel>
            <motion.form onSubmit={ask} className="glass flow-border p-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex items-center gap-3">
                <motion.div animate={portal ? { scale: 6, opacity: 0 } : { scale: [1, 1.08, 1] }} transition={portal ? { duration: 1.3 } : { repeat: Infinity, duration: 3 }}>
                  <SatoStar size={40} glow={portal ? 3 : 1} />
                </motion.div>
                <div><div className="font-display font-semibold">SATO</div><div className="text-[11px] text-muted-foreground">Your AI Flood Intelligence Companion</div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background/50 py-1 pl-4 pr-1">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about flood conditions in India..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
                <button type="submit" aria-label="Ask SATO" className="btn-aqua h-8 w-8 justify-center p-0"><ArrowRight className="h-4 w-4" /></button>
              </div>
            </motion.form>
          </div>
        </div>
      </motion.div>
      {portal && (
        <motion.div className="pointer-events-none fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.3, delay: 0.3 }}
          style={{ background: "radial-gradient(circle at 85% 85%, color-mix(in oklab, var(--aqua) 40%, transparent), var(--navy) 50%)" }} />
      )}
    </section>
  );
}
