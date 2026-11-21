import { useMemo, useState } from "react";
import { geoMercator, geoPath, geoCentroid, geoArea } from "d3-geo";
import { Minus, Plus, Layers, AlertCircle } from "lucide-react";
import { india } from "@/lib/geo";
import { getState, SEV_COLOR, SEV_LABEL, snapshotManager, type FloodSnapshot, type Severity } from "@/lib/flood";

export type Layer = "risk" | "impact" | "forecast";
const W = 600, H = 680;

interface IndiaMapProps {
  layer: Layer;
  selected?: string | null;
  onSelect?: (s: string) => void;
  compact?: boolean;
  snapshot?: FloodSnapshot;
}

export function IndiaMap({ layer, selected, onSelect, compact = false, snapshot: snapshotProp }: IndiaMapProps) {
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);

  const snapshot = snapshotProp ?? snapshotManager.getSnapshot();
  const isUnavailable = snapshot.status === "unavailable";

  const { path, proj } = useMemo(() => {
    const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], india);
    return { path: geoPath(proj), proj };
  }, []);

  const maxFloodedArea = useMemo(() => {
    const areas = Object.values(snapshot.states).map((s) => s.floodedAreaKm2);
    return Math.max(...areas, 3240);
  }, [snapshot]);

  const getStateInfo = (n: string) => getState(n, snapshot);

  const sevFor = (n: string): Severity => {
    if (isUnavailable) return "low";
    const s = getStateInfo(n);
    return layer === "forecast" ? s.forecastSeverity : s.severity;
  };

  const opacityFor = (n: string) => {
    if (isUnavailable) return 0.2;
    const s = getStateInfo(n);
    if (layer === "impact") {
      if (s.floodedAreaKm2 === 0) return 0.12;
      return 0.35 + Math.min(s.floodedAreaKm2 / maxFloodedArea, 1) * 0.6;
    }
    return 0.82;
  };

  return (
    <div className="relative h-full w-full select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={() => setHover(null)}>
        <defs>
          <filter id="ig">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%", transition: "transform 0.5s cubic-bezier(.22,1,.36,1)" }}>
          {india.features.map((f) => {
            const n = f.properties.name;
            const on = selected === n || hover?.name === n;
            const sev = sevFor(n);
            const fillCol = isUnavailable ? "var(--muted)" : SEV_COLOR[sev];
            const op = opacityFor(n);

            return (
              <path
                key={n}
                d={path(f) ?? ""}
                fill={fillCol}
                fillOpacity={op}
                stroke={on ? "var(--aqua)" : "var(--background)"}
                strokeWidth={on ? 2.2 / zoom : 0.6 / zoom}
                filter={on ? "url(#ig)" : undefined}
                className={compact ? "" : "cursor-pointer transition-[fill-opacity,fill] duration-300"}
                onMouseMove={
                  compact
                    ? undefined
                    : (e) => {
                        const b = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                        setHover({ name: n, x: e.clientX - b.left, y: e.clientY - b.top });
                      }
                }
                onClick={compact ? undefined : () => onSelect?.(n)}
              />
            );
          })}

          {!compact &&
            showLabels &&
            india.features
              .filter((f) => geoArea(f) > 0.0035)
              .map((f) => {
                const [x, y] = proj(geoCentroid(f)) ?? [0, 0];
                return (
                  <text
                    key={"t" + f.properties.name}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize={9 / zoom}
                    fill="var(--foreground)"
                    fillOpacity={isUnavailable ? 0.35 : 0.85}
                    className="pointer-events-none"
                    style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 2, strokeOpacity: 0.6 }}
                  >
                    {f.properties.name}
                  </text>
                );
              })}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hover && !compact && (
        <div
          className="glass pointer-events-none absolute z-20 max-w-xs px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(hover.x + 14, W - 220), top: Math.min(hover.y + 10, H - 120) }}
        >
          <div className="font-display font-semibold">{hover.name}</div>
          {isUnavailable ? (
            <div className="mt-1 text-[11px] text-amber-400/90 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Telemetry unavailable
            </div>
          ) : (
            <>
              <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[sevFor(hover.name)] }} />
                <span>
                  {layer === "forecast" ? `Forecast: ${getStateInfo(hover.name).forecastSeverity.toUpperCase()}` : SEV_LABEL[sevFor(hover.name)]}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-foreground/90">
                {getStateInfo(hover.name).floodedAreaKm2 > 0
                  ? `Inundated: ${getStateInfo(hover.name).floodedAreaKm2.toLocaleString()} km²`
                  : "No significant flood anomaly detected"}
              </div>
              {getStateInfo(hover.name).populationExposed ? (
                <div className="text-[10px] text-muted-foreground">
                  ~{(getStateInfo(hover.name).populationExposed! / 1000000).toFixed(2)}M people exposed (derived model)
                </div>
              ) : null}
              <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground/80">
                {snapshot.sourceAttribution.name.includes("Benchmark") ? "CWC / GloFAS Benchmark" : "Verified Snapshot"}
              </div>
            </>
          )}
        </div>
      )}

      {/* Controls & Legend (non-compact only) */}
      {!compact && (
        <>
          <div className="glass absolute right-3 top-3 space-y-1.5 px-3 py-2.5 text-[11px]">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {layer === "forecast" ? "72h Risk Outlook" : layer === "impact" ? "Inundation Extent" : "Severity Tier"}
            </div>
            {isUnavailable ? (
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Sensor Downlink Offline
              </div>
            ) : (
              (["severe", "moderate", "low"] as Severity[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: SEV_COLOR[s], boxShadow: `0 0 6px ${SEV_COLOR[s]}` }}
                  />
                  <span>
                    {s === "severe"
                      ? "High Risk / Emergency"
                      : s === "moderate"
                        ? "Moderate Risk / Warning"
                        : "Low / Normal"}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="glass absolute left-3 top-3 flex flex-col overflow-hidden">
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(z + 0.3, 2.5))}
              className="p-2 transition-colors hover:bg-panel-2"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(z - 0.3, 1))}
              className="border-t border-border p-2 transition-colors hover:bg-panel-2"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              aria-label="Toggle labels"
              onClick={() => setShowLabels((v) => !v)}
              className={`border-t border-border p-2 transition-colors hover:bg-panel-2 ${showLabels ? "text-aqua" : ""}`}
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* Unavailable State Overlay */}
      {isUnavailable && !compact && (
        <div className="glass pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-lg border border-amber-500/30 bg-background/80 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-display font-semibold text-sm">
            <AlertCircle className="h-4 w-4" />
            Observational Map Layer Unavailable
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {snapshot.errorMessage ?? "Satellite radar acquisition feed offline. Geographic boundary overlay preserved."}
          </p>
        </div>
      )}
    </div>
  );
}
