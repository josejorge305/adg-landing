import { useEffect, useRef, useState } from "react";
import { FL_PATH, FL_VIEWBOX, project as proj } from "./florida";

export type MapItem = { name: string; location: string; units: string; coords: [number, number]; kind: "project" | "lp" };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* South Florida detail frame, ADG's office, reference cities and the main highways (lat, lon waypoints) */
const SOUTH = { latMin: 25.4, latMax: 26.1, lonMin: -80.72, lonMax: -80.08 };
const inSouth = (c: [number, number]) => c[0] > SOUTH.latMin && c[0] < SOUTH.latMax && c[1] > SOUTH.lonMin && c[1] < SOUTH.lonMax;
const OFFICE: [number, number] = [25.707, -80.293];
const CITIES: { name: string; c: [number, number]; dx?: number; anchor?: "start" | "end" }[] = [
  { name: "Jacksonville", c: [30.33, -81.66], dx: 8 },
  { name: "Tallahassee", c: [30.44, -84.28], dx: 8 },
  { name: "Orlando", c: [28.54, -81.38], dx: 8 },
  { name: "Tampa", c: [27.95, -82.46], dx: -8, anchor: "end" },
  { name: "Miami", c: [25.77, -80.19], dx: 8 },
];
const SOUTH_CITIES: { name: string; c: [number, number]; dx: number; dy: number; anchor: "start" | "end" }[] = [
  { name: "Miami", c: [25.775, -80.19], dx: 1.2, dy: 0.5, anchor: "start" },
  { name: "Homestead", c: [25.468, -80.477], dx: 0, dy: 3.4, anchor: "end" },
  { name: "Hollywood", c: [26.011, -80.149], dx: -2.2, dy: 0.5, anchor: "end" },
];
const HIGHWAYS: [number, number][][] = [
  [[25.77, -80.2], [26.12, -80.17], [26.71, -80.07], [27.44, -80.35], [28.08, -80.66], [28.61, -80.84], [29.21, -81.1], [29.89, -81.35], [30.33, -81.66], [30.71, -81.66]],
  [[25.87, -80.34], [26.15, -80.9], [26.16, -81.77], [26.62, -81.82], [27.33, -82.45], [27.98, -82.36], [28.55, -82.25], [29.19, -82.14], [29.65, -82.37], [30.19, -82.64], [30.71, -83.03]],
  [[27.96, -82.44], [28.04, -81.95], [28.54, -81.38], [28.8, -81.27], [29.19, -81.07]],
  [[25.47, -80.48], [25.75, -80.37], [26.13, -80.24], [26.72, -80.14], [27.43, -80.43], [27.7, -80.9], [28.45, -81.47], [28.86, -82.05]],
  [[30.33, -81.7], [30.44, -84.28], [30.47, -87.2]],
];
const pathOf = (pts: [number, number][]) => "M" + pts.map(([la, lo]) => proj(la, lo).map((v) => v.toFixed(1)).join(" ")).join(" L");
function arc(a: [number, number], b: [number, number], bend = 0.22) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  return `M${a[0]} ${a[1]} Q${mx - dy * bend} ${my + dx * bend} ${b[0]} ${b[1]}`;
}
function spread(pts: [number, number][], gap: number) {
  const p = pts.map((x) => [...x] as [number, number]);
  for (let pass = 0; pass < 10; pass++)
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        let dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
        let d = Math.hypot(dx, dy);
        if (d >= gap) continue;
        if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
        const push = (gap - d) / 2;
        p[i] = [p[i][0] - (dx / d) * push, p[i][1] - (dy / d) * push];
        p[j] = [p[j][0] + (dx / d) * push, p[j][1] + (dy / d) * push];
      }
  return p;
}

export function Footprint({ items, onSelect }: { items: MapItem[]; onSelect: (name: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) { setDrawn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    const fs = window.setTimeout(() => setDrawn(true), 6000);
    return () => { io.disconnect(); window.clearTimeout(fs); };
  }, []);

  const numbered = items.map((it, i) => ({ ...it, n: i + 1 }));
  const south = numbered.filter((x) => inSouth(x.coords));
  const far = numbered.filter((x) => !inSouth(x.coords));
  const [bx1, by1] = proj(SOUTH.latMax, SOUTH.lonMin);
  const [bx2, by2] = proj(SOUTH.latMin, SOUTH.lonMax);
  const office = proj(OFFICE[0], OFFICE[1]);
  const southPts = spread(south.map((x) => proj(x.coords[0], x.coords[1])), 3.3);

  const pin = (it: (typeof numbered)[number], x: number, y: number, r: number, i: number, fontSize: number) => (
    <g
      key={it.name}
      className={`fp-pin ${it.kind}${active === it.name ? " is-active" : ""}`}
      style={{ ["--i" as string]: i } as React.CSSProperties}
      tabIndex={0}
      role="button"
      aria-label={`${it.n}. ${it.name}, ${it.location}`}
      onMouseEnter={() => setActive(it.name)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(it.name)}
      onBlur={() => setActive(null)}
      onClick={() => onSelect(it.name)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(it.name); } }}
    >
      <circle className="fp-ripple" cx={x} cy={y} r={r} />
      <circle className="fp-dot" cx={x} cy={y} r={r} vectorEffect="non-scaling-stroke" />
      <text className="fp-num" x={x} y={y} dy="0.36em" textAnchor="middle" style={{ fontSize }}>{it.n}</text>
    </g>
  );

  return (
    <div ref={ref} className={`fp2${drawn ? " is-drawn" : ""}`}>
      <ol className="fp-list">
        {(["project", "lp"] as const).map((kind) => (
          <li key={kind} className="fp-group">
            <p className="fp-group-title">{kind === "project" ? "Developments" : "Investments"}</p>
            <ol>
              {numbered.filter((x) => x.kind === kind).map((it) => (
                <li key={it.name}>
                  <button
                    className={active === it.name ? "is-active" : ""}
                    onMouseEnter={() => setActive(it.name)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(it.name)}
                    onBlur={() => setActive(null)}
                    onClick={() => onSelect(it.name)}
                  >
                    <span className={`fp-badge ${it.kind}`}>{it.n}</span>
                    <span className="fp-item"><strong>{it.name}</strong><small>{it.location} · {it.units}</small></span>
                  </button>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>

      <figure className="fp2-main">
        <svg viewBox={FL_VIEWBOX} role="img" aria-label="Map of ADG developments and investments across Florida">
          <defs>
            <radialGradient id="fp-sea" cx="62%" cy="58%" r="70%">
              <stop offset="0" stopColor="#15334a" />
              <stop offset="1" stopColor="#0d1f2d" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="-40" y="-40" width="800" height="760" fill="url(#fp-sea)" />
          <path d={FL_PATH} className="fp-land" vectorEffect="non-scaling-stroke" />
          {HIGHWAYS.map((h, i) => <path key={i} d={pathOf(h)} className="fp-road" vectorEffect="non-scaling-stroke" />)}
          {CITIES.map((c) => {
            const [x, y] = proj(c.c[0], c.c[1]);
            return (
              <g key={c.name} className="fp-city">
                <circle cx={x} cy={y} r={2.2} />
                <text x={x + (c.dx ?? 8)} y={y} dy="0.35em" textAnchor={c.anchor ?? "start"}>{c.name}</text>
              </g>
            );
          })}
          <rect x={bx1} y={by1} width={bx2 - bx1} height={by2 - by1} className="fp-frame" vectorEffect="non-scaling-stroke" />
          {far.map((it, k) => {
            const [x, y] = proj(it.coords[0], it.coords[1]);
            return <path key={"a" + it.name} d={arc(office, [x, y], 0.18)} pathLength={1} className="fp-arc" style={{ ["--d" as string]: `${0.15 + k * 0.18}s` } as React.CSSProperties} />;
          })}
          {south.map((it) => {
            const [x, y] = proj(it.coords[0], it.coords[1]);
            return <circle key={"s" + it.name} cx={x} cy={y} r={3.2} className={`fp-mini ${it.kind}`} />;
          })}
          {far.map((it, k) => {
            const [x, y] = proj(it.coords[0], it.coords[1]);
            return (
              <g key={"f" + it.name}>
                {pin(it, x, y, 9, 2 + k, 11)}
                <text className="fp-callout" x={x + (x < 400 ? -15 : 15)} y={y} dy="0.35em" textAnchor={x < 400 ? "end" : "start"}>{it.name}</text>
              </g>
            );
          })}
        </svg>
      </figure>

      <figure className="fp2-inset">
        <svg viewBox={`${bx1} ${by1} ${bx2 - bx1} ${by2 - by1}`} role="img" aria-label="Detail of South Florida">
          <rect x={bx1} y={by1} width={bx2 - bx1} height={by2 - by1} className="fp-inset-sea" />
          <path d={FL_PATH} className="fp-land" vectorEffect="non-scaling-stroke" />
          {HIGHWAYS.map((h, i) => <path key={i} d={pathOf(h)} className="fp-road" vectorEffect="non-scaling-stroke" />)}
          {SOUTH_CITIES.map((c) => {
            const [x, y] = proj(c.c[0], c.c[1]);
            return <text key={c.name} className="fp-city-s" x={x + c.dx} y={y + c.dy} textAnchor={c.anchor}>{c.name}</text>;
          })}
          {south.map((it, k) => (
            <path key={"a" + it.name} d={arc(office, southPts[k], 0.25)} pathLength={1} className="fp-arc" style={{ ["--d" as string]: `${0.1 + k * 0.12}s` } as React.CSSProperties} />
          ))}
          <g className="fp-office">
            <rect x={office[0] - 0.9} y={office[1] - 0.9} width={1.8} height={1.8} transform={`rotate(45 ${office[0]} ${office[1]})`} />
            <text x={office[0] - 1.8} y={office[1] + 0.5} textAnchor="end">ADG office</text>
          </g>
          {south.map((it, k) => pin(it, southPts[k][0], southPts[k][1], 1.45, k, 1.55))}
        </svg>
        <figcaption>South Florida detail</figcaption>
      </figure>
    </div>
  );
}
