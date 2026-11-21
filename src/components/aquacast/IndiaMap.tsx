import { useMemo, useState } from "react";
import { geoMercator, geoPath, geoCentroid, geoArea } from "d3-geo";
import { Minus, Plus, Layers } from "lucide-react";
import { india } from "@/lib/geo";
import { getState, SEV_COLOR, SEV_LABEL, type Severity } from "@/lib/flood";

export type Layer = "risk" | "impact" | "forecast";
const W = 600, H = 680;

export function IndiaMap({ layer, selected, onSelect, compact = false }: { layer: Layer; selected?: string | null; onSelect?: (s: string) => void; compact?: boolean }) {
  const [hover, setHover] = useState<{ name: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const { path, proj } = useMemo(() => {
    const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], india);
    return { path: geoPath(proj), proj };
  }, []);
  const sevFor = (n: string): Severity => (layer === "forecast" ? getState(n).forecast : getState(n).severity);
  const opacityFor = (n: string) => (layer === "impact" ? 0.25 + Math.min(getState(n).area / 3240, 1) * 0.7 : 0.78);

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" onMouseLeave={() => setHover(null)}>
        <defs>
          <filter id="ig"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g style={{ transform: `scale(${zoom})`, transformOrigin: "50% 50%", transition: "transform 0.5s cubic-bezier(.22,1,.36,1)" }}>
          {india.features.map((f) => {
            const n = f.properties.name;
            const on = selected === n || hover?.name === n;
            return (
              <path key={n} d={path(f) ?? ""} fill={SEV_COLOR[sevFor(n)]} fillOpacity={opacityFor(n)}
                stroke={on ? "var(--aqua)" : "var(--background)"} strokeWidth={on ? 2 / zoom : 0.6 / zoom} filter={on ? "url(#ig)" : undefined}
                className={compact ? "" : "cursor-pointer transition-[fill-opacity,fill] duration-500"}
                onMouseMove={compact ? undefined : (e) => {
                  const b = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setHover({ name: n, x: e.clientX - b.left, y: e.clientY - b.top });
                }}
                onClick={compact ? undefined : () => onSelect?.(n)} />
            );
          })}
          {!compact && showLabels && india.features.filter((f) => geoArea(f) > 0.0035).map((f) => {
            const [x, y] = proj(geoCentroid(f)) ?? [0, 0];
            return <text key={"t" + f.properties.name} x={x} y={y} textAnchor="middle" fontSize={9 / zoom} fill="var(--foreground)" fillOpacity="0.85" className="pointer-events-none" style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 2, strokeOpacity: 0.5 }}>{f.properties.name}</text>;
          })}
        </g>
      </svg>
      {hover && !compact && (
        <div className="glass pointer-events-none absolute z-20 px-3 py-2 text-xs" style={{ left: hover.x + 14, top: hover.y + 10 }}>
          <div className="font-display font-semibold">{hover.name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[sevFor(hover.name)] }} />
            {SEV_LABEL[sevFor(hover.name)]}{getState(hover.name).area ? ` · ${getState(hover.name).area.toLocaleString()} km²` : ""}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground/70">Illustrative data</div>
        </div>
      )}
      {!compact && (
        <>
          <div className="glass absolute right-3 top-3 space-y-1.5 px-3 py-2.5 text-[11px]">
            {(["severe", "moderate", "low"] as Severity[]).map((s) => (
              <div key={s} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SEV_COLOR[s], boxShadow: `0 0 6px ${SEV_COLOR[s]}` }} />{s === "severe" ? "High risk" : s === "moderate" ? "Moderate risk" : "Low risk"}</div>
            ))}
          </div>
          <div className="glass absolute left-3 top-3 flex flex-col overflow-hidden">
            <button aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(z + 0.3, 2.5))} className="p-2 hover:bg-panel-2"><Plus className="h-4 w-4" /></button>
            <button aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(z - 0.3, 1))} className="border-t border-border p-2 hover:bg-panel-2"><Minus className="h-4 w-4" /></button>
            <button aria-label="Toggle labels" onClick={() => setShowLabels((v) => !v)} className={`border-t border-border p-2 hover:bg-panel-2 ${showLabels ? "text-aqua" : ""}`}><Layers className="h-4 w-4" /></button>
          </div>
        </>
      )}
    </div>
  );
}
