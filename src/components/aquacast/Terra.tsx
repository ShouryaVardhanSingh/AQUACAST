import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldCheck,
  Triangle,
  ArrowRight,
  Sparkles,
  Globe2,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Wheat,
  Activity,
  Layers as LayersIcon,
  Copy,
  Check,
  AlertCircle,
  Database,
  RefreshCw,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getState,
  SEV_COLOR,
  SEV_LABEL,
  SEV_BADGE_BG,
  snapshotManager,
  type FloodSnapshot,
  type StateFloodInfo,
} from "@/lib/flood";
import { Wordmark, SatoStar } from "./Logo";
import { Particles } from "./Starfield";
import { IndiaMap, type Layer } from "./IndiaMap";

const TABS = ["Overview", "Risk Analysis", "Forecast", "Reports"] as const;
type TabType = (typeof TABS)[number];

const LAYERS: { id: Layer; label: string }[] = [
  { id: "risk", label: "Risk Map" },
  { id: "impact", label: "Impact" },
  { id: "forecast", label: "Forecast" },
];

function Panel({
  title,
  badge,
  children,
  className = "",
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`glass p-4 ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {badge}
      </div>
      {children}
    </motion.div>
  );
}

const ProvenanceBadge = ({ text = "CWC / GloFAS" }: { text?: string }) => (
  <span className="rounded-full border border-border bg-panel-2 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
    {text}
  </span>
);

export function Terra({ onAskSato }: { onAskSato: (q: string) => void }) {
  const [snapshot, setSnapshot] = useState<FloodSnapshot>(() => snapshotManager.getSnapshot());
  const [tab, setTab] = useState<TabType>("Overview");
  const [layer, setLayer] = useState<Layer>("risk");
  const [sel, setSel] = useState<string | null>("Assam");
  const [q, setQ] = useState("Which regions are most affected?");
  const [portal, setPortal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return snapshotManager.subscribe((snap) => {
      setSnapshot(snap);
      if (snap.topAffectedStates.length > 0 && !snap.topAffectedStates.some((s) => s.name === sel)) {
        setSel(snap.topAffectedStates[0]!.name);
      }
    });
  }, [sel]);

  const isUnavailable = snapshot.status === "unavailable";
  const selData: StateFloodInfo | null = sel ? getState(sel, snapshot) : null;

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setPortal(true);
    setTimeout(() => onAskSato(q.trim()), 1200);
  };

  const copySituationReport = () => {
    const reportText = `AQUACAST FLOOD SITUATION REPORT
Snapshot: ${snapshot.title}
Observation Date: ${snapshot.observationDate}
Data Source: ${snapshot.sourceAttribution.name}
Total Severely Inundated: ${snapshot.summary.totalSeverelyFloodedKm2.toLocaleString()} km²
Total Moderately Inundated: ${snapshot.summary.totalModeratelyFloodedKm2.toLocaleString()} km²
Estimated Population Exposed: ~${(snapshot.summary.totalPopulationExposed / 1000000).toFixed(1)}M
Top Inundated States:
${snapshot.topAffectedStates
  .slice(0, 5)
  .map((s, i) => `${i + 1}. ${s.name}: ${s.floodedAreaKm2.toLocaleString()} km² (${s.severity.toUpperCase()})`)
  .join("\n")}
7-Day Evolution: ${snapshot.summary.change7dPct > 0 ? "+" : ""}${snapshot.summary.change7dPct}%`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden bg-background p-3 md:p-4"
      style={{ background: "radial-gradient(ellipse at 50% 40%, var(--navy), var(--background) 70%)" }}
    >
      <Particles count={24} seed={41} />

      <motion.div
        animate={portal ? { opacity: 0.25, filter: "blur(4px)" } : { opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative mx-auto max-w-7xl"
      >
        {/* HEADER */}
        <header className="glass mb-3 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <Wordmark name="TERRA" sub="Flood Intelligence" />

          {/* Navigation Tabs */}
          <nav className="flex gap-1 text-xs">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative rounded-full px-3.5 py-1.5 transition-colors ${
                  tab === t ? "text-aqua font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === t && (
                  <motion.span
                    layoutId="tab"
                    className="absolute inset-0 rounded-full border border-aqua/60 bg-electric/20"
                    style={{ boxShadow: "var(--glow-aqua)" }}
                  />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </nav>

          {/* Scenario & Provenance Selector */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-panel/70 px-2.5 py-1 text-muted-foreground">
              <Database className="h-3 w-3 text-aqua" />
              <select
                aria-label="Select benchmark snapshot"
                value={snapshot.scenarioName}
                onChange={(e) =>
                  snapshotManager.setScenario(e.target.value as "monsoon_peak" | "recession" | "unavailable")
                }
                className="bg-transparent text-[11px] font-medium text-foreground outline-none cursor-pointer pr-1"
              >
                <option value="monsoon_peak" className="bg-navy text-foreground">
                  Benchmark: Monsoon Peak
                </option>
                <option value="recession" className="bg-navy text-foreground">
                  Benchmark: Post-Monsoon Recession
                </option>
                <option value="unavailable" className="bg-navy text-foreground">
                  Simulate: Sensor Telemetry Outage
                </option>
              </select>
            </div>

            <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-muted-foreground">
              <Globe2 className="h-3.5 w-3.5 text-aqua" /> India
            </span>
          </div>
        </header>

        {/* PROVENANCE ALERT STRIP */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-panel/40 px-3.5 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-aqua animate-pulse" />
            <span className="font-medium text-foreground">Source Provenance:</span>
            <span>{snapshot.sourceAttribution.name}</span>
            <span className="hidden md:inline text-muted-foreground/70">
              · Obs. {snapshot.observationDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isUnavailable ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-medium">
                <AlertCircle className="h-3 w-3" /> Telemetry Outage
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-electric/20 px-2 py-0.5 text-[10px] text-aqua">
                <ShieldCheck className="h-3 w-3" /> Ground-Verified Hydrological Benchmark
              </span>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {tab === "Overview" && (
          <div className="grid gap-3 lg:grid-cols-[300px_1fr_320px]">
            {/* LEFT COLUMN */}
            <div className="space-y-3">
              <Panel title="India Inundation Extent" badge={<ProvenanceBadge text={snapshot.observationDate} />}>
                {isUnavailable ? (
                  <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-300">
                    <AlertCircle className="mx-auto mb-1 h-5 w-5" />
                    <strong>Observational Data Offline</strong>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Telemetry downlink unavailable. Metrics not fabricated.
                    </p>
                  </div>
                ) : (
                  [
                    {
                      icon: AlertTriangle,
                      v: `${(snapshot.summary.totalSeverelyFloodedKm2 / 1000).toFixed(1)}k km²`,
                      l: "Severely Inundated",
                      c: "var(--severe)",
                    },
                    {
                      icon: Triangle,
                      v: `${(snapshot.summary.totalModeratelyFloodedKm2 / 1000).toFixed(1)}k km²`,
                      l: "Moderately Inundated",
                      c: "var(--moderate)",
                    },
                    {
                      icon: ShieldCheck,
                      v: `${snapshot.summary.normalAreaPercentage}%`,
                      l: "Low / Normal River Basin",
                      c: "var(--low)",
                    },
                  ].map(({ icon: I, v, l, c }, i) => (
                    <motion.div
                      key={l}
                      className="flex items-center gap-3 border-b border-border/50 py-2.5 last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                    >
                      <I className="h-6 w-6" style={{ color: c, filter: `drop-shadow(0 0 6px ${c})` }} />
                      <div>
                        <div className="font-display text-xl font-semibold" style={{ color: i === 0 ? c : undefined }}>
                          {v}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{l}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </Panel>

              {/* AFFECTED STATES LIST */}
              <Panel
                title="Affected States Ranking"
                badge={<span className="text-[10px] text-muted-foreground font-mono">{snapshot.topAffectedStates.length} states</span>}
              >
                {isUnavailable ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">State inundation data unavailable.</p>
                ) : (
                  <ul className="max-h-48 space-y-0.5 overflow-auto pr-1 text-xs">
                    {snapshot.topAffectedStates.map((s) => (
                      <li key={s.name}>
                        <button
                          onClick={() => setSel(s.name)}
                          className={`flex w-full items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-panel-2 ${
                            sel === s.name ? "bg-panel-2 text-aqua border border-aqua/40" : ""
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[s.severity] }} />
                          <span className="flex-1 text-left font-medium">{s.name}</span>
                          <span className="text-muted-foreground font-mono">
                            {s.floodedAreaKm2.toLocaleString()} km²
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              {/* 7-DAY HISTORICAL TREND CHART */}
              <Panel
                title="Flood Extent (Last 7 Days)"
                badge={
                  isUnavailable ? (
                    <span className="text-[10px] text-muted-foreground font-mono">Offline</span>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-mono flex items-center gap-0.5 ${
                        snapshot.summary.change7dPct >= 0
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {snapshot.summary.change7dPct >= 0 ? (
                        <TrendingUp className="h-3 w-3 inline" />
                      ) : (
                        <TrendingDown className="h-3 w-3 inline" />
                      )}
                      {snapshot.summary.change7dPct >= 0 ? "+" : ""}
                      {snapshot.summary.change7dPct}%
                    </span>
                  )
                }
              >
                {isUnavailable || snapshot.trend.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                    Historical telemetry records unavailable for current cycle.
                  </div>
                ) : (
                  <>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={snapshot.trend} margin={{ left: -24, right: 4, top: 4 }}>
                          <defs>
                            <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0" stopColor="var(--aqua)" stopOpacity={0.5} />
                              <stop offset="1" stopColor="var(--electric)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--navy)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                            formatter={(v: any) => [`${v}k km²`, "Flooded Area"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="floodedAreaThousandKm2"
                            stroke="var(--aqua)"
                            strokeWidth={2}
                            fill="url(#tg)"
                            isAnimationActive={false}
                            dot={{ r: 2, fill: "var(--aqua)" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> CWC Daily Situation Bulletin Timeline · Inundated Extent (km²)
                    </p>
                  </>
                )}
              </Panel>
            </div>

            {/* CENTER MAP COLUMN */}
            <motion.div
              className="glass flow-border relative min-h-[560px] overflow-hidden lg:min-h-0"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="absolute inset-0 pb-14">
                <IndiaMap layer={layer} selected={sel} onSelect={setSel} snapshot={snapshot} />
              </div>

              {/* Selected State Badge */}
              {sel && selData && (
                <div className="glass absolute bottom-16 left-3 px-3 py-2 text-xs max-w-xs shadow-lg">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: isUnavailable ? "var(--muted)" : SEV_COLOR[selData.severity] }}
                    />
                    <span className="font-display font-semibold">{sel}</span>
                    <span
                      className="rounded px-1.5 py-0.2 text-[9px] font-semibold"
                      style={{
                        background: isUnavailable ? "var(--muted)" : SEV_BADGE_BG[selData.severity],
                        color: isUnavailable ? "var(--muted-foreground)" : SEV_COLOR[selData.severity],
                      }}
                    >
                      {isUnavailable ? "N/A" : selData.severity.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {isUnavailable ? (
                      "Data offline"
                    ) : selData.floodedAreaKm2 > 0 ? (
                      <>
                        <span className="text-foreground font-mono font-medium">
                          {selData.floodedAreaKm2.toLocaleString()} km²
                        </span>{" "}
                        inundated
                        {selData.populationExposed && (
                          <span className="block text-[10px]">
                            ~{(selData.populationExposed / 1000000).toFixed(2)}M people exposed (derived model)
                          </span>
                        )}
                      </>
                    ) : (
                      "No significant flood anomaly detected"
                    )}
                  </div>
                </div>
              )}

              {/* Layer Toggles */}
              <div className="glass absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full p-1 text-xs">
                {LAYERS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLayer(l.id)}
                    className="relative rounded-full px-4 py-1.5 transition-colors"
                  >
                    {layer === l.id && (
                      <motion.span
                        layoutId="layer"
                        className="absolute inset-0 rounded-full bg-electric/40"
                        style={{ boxShadow: "var(--glow-aqua)" }}
                      />
                    )}
                    <span className="relative">{l.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              {/* 72H FORECAST PANEL */}
              <Panel
                title="72-Hour Hydrological Forecast"
                badge={<span className="rounded-full bg-electric/30 px-2 py-0.5 text-[10px] text-aqua">GloFAS · Runoff Model</span>}
              >
                <p className="-mt-1 mb-2.5 text-[11px] text-muted-foreground">
                  River discharge crest projections based on ECMWF/GloFAS hydrological routing:
                </p>

                {isUnavailable || snapshot.forecast.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">Forecast model telemetry unavailable.</p>
                ) : (
                  snapshot.forecast.map((f) => (
                    <div key={f.region} className="border-b border-border/40 py-2 last:border-0 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" style={{ color: SEV_COLOR[f.severity] }} />
                          <span>{f.region}</span>
                        </div>
                        <span
                          className="rounded px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            color: SEV_COLOR[f.severity],
                            background: SEV_BADGE_BG[f.severity],
                          }}
                        >
                          {f.level} Risk
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{f.details}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground/75 font-mono">
                        <span>Expected Peak: {f.expectedPeak}</span>
                        <span>Confidence: {f.confidence}</span>
                      </div>
                    </div>
                  ))
                )}

                <div className="mt-2 h-28 overflow-hidden rounded-md border border-border bg-navy">
                  <IndiaMap layer="forecast" compact snapshot={snapshot} />
                </div>
              </Panel>

              {/* KEY INSIGHTS */}
              <Panel title="Intelligence Briefing" badge={<ProvenanceBadge text="Assessed" />}>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {snapshot.keyInsights.map((t, i) => (
                    <li key={i} className="flex gap-2 leading-relaxed">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-aqua" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* SATO ASSISTANT LAUNCHER */}
              <motion.form
                onSubmit={ask}
                className="glass flow-border p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={portal ? { scale: 6, opacity: 0 } : { scale: [1, 1.08, 1] }}
                    transition={portal ? { duration: 1.2 } : { repeat: Infinity, duration: 3 }}
                  >
                    <SatoStar size={40} glow={portal ? 3 : 1} />
                  </motion.div>
                  <div>
                    <div className="font-display font-semibold flex items-center gap-1.5">
                      <span>SATO</span>
                      <span className="rounded bg-electric/25 px-1.5 py-0.2 text-[9px] text-aqua">Grounded AI</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Ask about regional flood extent, river basins, or trends
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background/50 py-1 pl-4 pr-1">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ask about flood conditions in India..."
                    className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                  />
                  <button type="submit" aria-label="Ask SATO" className="btn-aqua h-8 w-8 justify-center p-0">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.form>
            </div>
          </div>
        )}

        {/* TAB 2: RISK ANALYSIS */}
        {tab === "Risk Analysis" && (
          <div className="space-y-3">
            {/* Top Stat Row */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Panel title="Total Inundation Extent" badge={<ProvenanceBadge />}>
                <div className="font-display text-2xl font-bold text-foreground">
                  {isUnavailable
                    ? "N/A"
                    : `${(
                        (snapshot.summary.totalSeverelyFloodedKm2 + snapshot.summary.totalModeratelyFloodedKm2)
                      ).toLocaleString()} km²`}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sum of severe ({snapshot.summary.totalSeverelyFloodedKm2.toLocaleString()} km²) and moderate impact areas
                </p>
              </Panel>

              <Panel title="Population Exposure" badge={<ProvenanceBadge text="Derived Census" />}>
                <div className="font-display text-2xl font-bold text-aqua">
                  {isUnavailable ? "N/A" : `~${(snapshot.summary.totalPopulationExposed / 1000000).toFixed(1)}M`}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Estimated residents within high & moderate flood risk zones
                </p>
              </Panel>

              <Panel title="Cropland Inundated" badge={<ProvenanceBadge text="LandScan / CWC" />}>
                <div className="font-display text-2xl font-bold text-amber-300">
                  {isUnavailable ? "N/A" : `~${snapshot.summary.totalCroplandFloodedKm2.toLocaleString()} km²`}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Submerged agricultural acreage affecting monsoon crop cycles
                </p>
              </Panel>

              <Panel title="7-Day Trajectory" badge={<ProvenanceBadge text="Observed" />}>
                <div
                  className={`font-display text-2xl font-bold ${
                    snapshot.summary.change7dPct >= 0 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {isUnavailable ? "N/A" : `${snapshot.summary.change7dPct >= 0 ? "+" : ""}${snapshot.summary.change7dPct}%`}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {snapshot.summary.change7dPct >= 0 ? "Floodwaters expanding across basins" : "Waters steadily draining"}
                </p>
              </Panel>
            </div>

            {/* Comprehensive State Risk Matrix */}
            <Panel title="State-by-State Exposure Matrix" badge={<ProvenanceBadge text="Benchmark Catalog" />}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground text-[11px]">
                      <th className="py-2.5 font-medium">State / Territory</th>
                      <th className="py-2.5 font-medium">Severity Classification</th>
                      <th className="py-2.5 font-medium">Inundated Area</th>
                      <th className="py-2.5 font-medium">Population Exposed (est.)</th>
                      <th className="py-2.5 font-medium">Cropland Flooded</th>
                      <th className="py-2.5 font-medium">Roads Affected</th>
                      <th className="py-2.5 font-medium">Primary Basin</th>
                      <th className="py-2.5 font-medium">7d Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {snapshot.topAffectedStates.map((s) => (
                      <tr key={s.name} className="hover:bg-panel-2/50 transition-colors">
                        <td className="py-2.5 font-medium flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[s.severity] }} />
                          {s.name}
                        </td>
                        <td className="py-2.5">
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase"
                            style={{ background: SEV_BADGE_BG[s.severity], color: SEV_COLOR[s.severity] }}
                          >
                            {s.severity}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-foreground">
                          {s.floodedAreaKm2.toLocaleString()} km²
                        </td>
                        <td className="py-2.5 text-muted-foreground font-mono">
                          {s.populationExposed ? `~${(s.populationExposed / 1000000).toFixed(2)}M` : "N/A"}
                        </td>
                        <td className="py-2.5 text-muted-foreground font-mono">
                          {s.croplandAreaKm2 ? `${s.croplandAreaKm2.toLocaleString()} km²` : "N/A"}
                        </td>
                        <td className="py-2.5 text-muted-foreground font-mono">
                          {s.criticalInfrastructure?.roadsKm ? `${s.criticalInfrastructure.roadsKm} km` : "N/A"}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{s.primaryRiverBasins.join(", ")}</td>
                        <td className="py-2.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-mono ${
                              s.trend7d === "rising"
                                ? "text-rose-400 bg-rose-500/10"
                                : s.trend7d === "receding"
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : "text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {s.trend7d}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* River Basin Hydrology Telemetry */}
            <Panel title="River Basin Gauge Stations" badge={<ProvenanceBadge text="CWC Stream Gauges" />}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {snapshot.riverBasins.map((b) => (
                  <div key={b.basinName} className="rounded-lg border border-border/50 bg-panel/30 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{b.basinName}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          b.status === "Above Danger"
                            ? "bg-rose-500/20 text-rose-300"
                            : b.status === "Above Warning"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="mt-2 text-muted-foreground">Station: {b.stationName}</div>
                    <div className="mt-1 flex justify-between font-mono text-[11px]">
                      <span>Discharge:</span>
                      <span className="text-foreground font-medium">
                        {b.currentDischargeM3s ? `${b.currentDischargeM3s.toLocaleString()} m³/s` : "Offline"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground/75 font-mono">
                      <span>Danger Mark:</span>
                      <span>{b.dangerDischargeM3s ? `${b.dangerDischargeM3s.toLocaleString()} m³/s` : "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {/* TAB 3: FORECAST */}
        {tab === "Forecast" && (
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <Panel title="72-Hour River Discharge Forecast" badge={<ProvenanceBadge text="ECMWF GloFAS" />}>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hydrological routing models simulate river discharge wave travel times over the next 72 hours.
                  Colors represent projected severity levels if downstream embankments are overtopped.
                </p>

                <div className="mt-3 space-y-3">
                  {snapshot.forecast.map((f) => (
                    <div key={f.region} className="rounded-lg border border-border/60 bg-panel/40 p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <AlertTriangle className="h-4 w-4" style={{ color: SEV_COLOR[f.severity] }} />
                          {f.region}
                        </div>
                        <span
                          className="rounded px-2.5 py-0.5 text-[10px] font-bold"
                          style={{ background: SEV_BADGE_BG[f.severity], color: SEV_COLOR[f.severity] }}
                        >
                          {f.level} Risk Level
                        </span>
                      </div>
                      <p className="mt-2 text-muted-foreground leading-relaxed">{f.details}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] font-mono text-muted-foreground">
                        <span>Expected Peak: <strong className="text-foreground">{f.expectedPeak}</strong></span>
                        <span>Projected Inundation Change: <strong className="text-aqua">+{f.projectedAreaDeltaPct}%</strong></span>
                        <span>Model Confidence: <strong className="text-foreground">{f.confidence}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Forecast Map View" badge={<ProvenanceBadge text="72h Projected Tier" />}>
                <div className="h-[460px] overflow-hidden rounded-md border border-border bg-navy">
                  <IndiaMap layer="forecast" selected={sel} onSelect={setSel} snapshot={snapshot} />
                </div>
              </Panel>
            </div>
          </div>
        )}

        {/* TAB 4: REPORTS & PROVENANCE AUDIT */}
        {tab === "Reports" && (
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-2">
              <Panel
                title="AQUACAST Situation Brief"
                badge={
                  <button
                    onClick={copySituationReport}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-panel-2 px-3 py-1 text-[10px] text-muted-foreground hover:text-aqua transition-colors"
                  >
                    {copied ? <Check className="h-3 w-3 text-aqua" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied!" : "Copy Situation Brief"}</span>
                  </button>
                }
              >
                <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="rounded-lg border border-border/60 bg-background/50 p-3.5 font-mono text-[11px] space-y-1.5 text-foreground/90">
                    <div><strong>INCIDENT:</strong> {snapshot.title}</div>
                    <div><strong>OBSERVATION DATE:</strong> {snapshot.observationDate}</div>
                    <div><strong>TOTAL SEVERELY FLOODED:</strong> {snapshot.summary.totalSeverelyFloodedKm2.toLocaleString()} km²</div>
                    <div><strong>TOTAL MODERATELY FLOODED:</strong> {snapshot.summary.totalModeratelyFloodedKm2.toLocaleString()} km²</div>
                    <div><strong>EXPOSED POPULATION (EST.):</strong> ~{(snapshot.summary.totalPopulationExposed / 1000000).toFixed(1)} Million</div>
                    <div><strong>7-DAY DELTA:</strong> {snapshot.summary.change7dPct > 0 ? "+" : ""}{snapshot.summary.change7dPct}%</div>
                    <div><strong>SOURCE:</strong> {snapshot.sourceAttribution.name}</div>
                  </div>

                  <h4 className="font-display font-semibold text-foreground text-sm">Key Situation Takeaways</h4>
                  <ul className="space-y-1.5">
                    {snapshot.keyInsights.map((k, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-aqua">•</span>
                        <span>{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>

              <Panel title="Data Provenance & Sensor Limitations" badge={<ProvenanceBadge text="Transparency Audit" />}>
                <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="rounded-lg border border-border/60 bg-panel/30 p-3 space-y-1">
                    <div className="font-semibold text-foreground">Data Provider & Source Attribution</div>
                    <p className="text-[11px]">{snapshot.sourceAttribution.provider}</p>
                    <p className="text-[11px] font-mono text-muted-foreground/80">License: {snapshot.sourceAttribution.license}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-panel/30 p-3 space-y-1">
                    <div className="font-semibold text-foreground">Methodology Description</div>
                    <p className="text-[11px]">{snapshot.sourceAttribution.methodology}</p>
                  </div>

                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1 text-amber-200">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-300" />
                      Honesty & Transparency Disclaimer
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-200/90">{snapshot.sourceAttribution.disclaimer}</p>
                  </div>

                  <div>
                    <div className="font-semibold text-foreground mb-1">Identified System Limitations:</div>
                    <ul className="space-y-1 text-[11px]">
                      {snapshot.dataLimitations.map((l, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-muted-foreground">—</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </motion.div>

      {/* SATO Portal Animation Overlay */}
      {portal && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          style={{
            background:
              "radial-gradient(circle at 85% 85%, color-mix(in oklab, var(--aqua) 40%, transparent), var(--navy) 50%)",
          }}
        />
      )}
    </section>
  );
}
