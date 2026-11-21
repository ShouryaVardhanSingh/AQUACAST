import { useEffect, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import { land } from "@/lib/geo";

export function Globe({ center, size, id }: { center: [number, number]; size: number; id: string }) {
  const [rot, setRot] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const tick = (t: number) => { setRot(Math.sin((t - start) / 9000) * 18); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  const r = size / 2;
  const path = useMemo(() => geoPath(geoOrthographic().scale(r - 2).translate([r, r]).rotate([-center[0] - rot, -center[1] * 0.6]).clipAngle(90)), [r, center, rot]);
  const grat = useMemo(() => geoGraticule10(), []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        <radialGradient id={`oc-${id}`} cx="38%" cy="35%">
          <stop offset="0" stopColor="var(--ocean)" />
          <stop offset="1" stopColor="var(--ocean-deep)" />
        </radialGradient>
        <linearGradient id={`ld-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--land)" />
          <stop offset="0.6" stopColor="var(--land-dry)" />
          <stop offset="1" stopColor="var(--land)" />
        </linearGradient>
        <radialGradient id={`sh-${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0.45" stopColor="var(--background)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--background)" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r + 6} fill="none" stroke="var(--electric)" strokeOpacity="0.35" strokeWidth="8" style={{ filter: "blur(6px)" }} />
      <circle cx={r} cy={r} r={r - 2} fill={`url(#oc-${id})`} />
      <path d={path(grat) ?? ""} fill="none" stroke="var(--aqua)" strokeOpacity="0.07" />
      <path d={path(land) ?? ""} fill={`url(#ld-${id})`} stroke="var(--land-dry)" strokeOpacity="0.5" strokeWidth="0.4" />
      <circle cx={r} cy={r} r={r - 2} fill={`url(#sh-${id})`} />
      <circle cx={r} cy={r} r={r - 2} fill="none" stroke="var(--aqua)" strokeOpacity="0.5" strokeWidth="1.2" />
    </svg>
  );
}
