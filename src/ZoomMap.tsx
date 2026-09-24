import { useEffect, useRef, useState } from "react";

export type ZItem = { name: string; location: string; units: string; coords: [number, number]; kind: "project" | "lp"; image: string };

/* Statewide imagery is Web Mercator at zoom 8; the South Florida detail sits inside it at 16x resolution */
const STATE = { w: 1493, h: 1421, x0: 16784.49777777778, y0: 26784.72467787358 };
const SOUTH = { x: 1285.2337777777793, y: 1054.461480228354, w: 123.79022222221829, h: 149.56647521307605 };
const OFFICE: [number, number] = [25.707, -80.293];
const CITIES: { name: string; c: [number, number]; zoomed?: boolean }[] = [
  { name: "Tallahassee", c: [30.44, -84.28] }, { name: "Jacksonville", c: [30.33, -81.66] }, { name: "Orlando", c: [28.54, -81.38] },
  { name: "Tampa", c: [27.95, -82.46] }, { name: "Miami", c: [25.77, -80.19] },
  { name: "Miami", c: [25.775, -80.19], zoomed: true }, { name: "Homestead", c: [25.468, -80.477], zoomed: true },
  { name: "Hollywood", c: [26.011, -80.149], zoomed: true },
];
const inSouth = (c: [number, number]) => c[0] > 25.38 && c[0] < 26.12 && c[1] > -80.74 && c[1] < -80.06;

function base(lat: number, lon: number): [number, number] {
  const n = 256 * 2 ** 8;
  const x = ((lon + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return [x - STATE.x0, y - STATE.y0];
}
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function ZoomMap({ items, onSelect }: { items: ZItem[]; onSelect: (name: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cityRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const clusterRef = useRef<HTMLButtonElement>(null);
  const officeRef = useRef<HTMLDivElement>(null);
  const zoom = useRef(0);            // 0 = statewide, 1 = South Florida (eased)
  const anim = useRef(0);
  const [target, setTarget] = useState<0 | 1>(0);
  const redraw = useRef<() => void>(() => {});
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flyTo = (to: 0 | 1) => {
    setTarget(to);
    cancelAnimationFrame(anim.current);
    const from = zoom.current;
    if (reduced) { zoom.current = to; redraw.current(); return; }
    const t0 = performance.now(), dur = 1700 * Math.max(0.35, Math.abs(to - from));
    const step = (now: number) => {
      const k = clamp((now - t0) / dur);
      zoom.current = from + (to - from) * ease(k);
      redraw.current();
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };
  const [card, setCard] = useState<{ it: ZItem; x: number; y: number } | null>(null);
  const cardFor = useRef<string | null>(null);
  const lastPointer = useRef<string>("mouse");
  const cardWasOpen = useRef(false);
  const southItems = items.filter((i) => inSouth(i.coords));

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const t = track.current, v = view.current, w = world.current;
      if (!t || !v || !w) return;
      const vw = v.clientWidth, vh = v.clientHeight;
      const e = zoom.current;
      // statewide framing (land only, room for the heading) and the South Florida framing
      const narrow = vw < 760;
      // phones frame the peninsula (every project is there); wider screens show the whole state
      const sA = narrow ? Math.min(vw / 640, (vh - 230) / 1120) : Math.min(vw / 1250, (vh * 0.86) / 1250);
      const cA: [number, number] = narrow ? [1150, 760] : [760, 700];
      const sB = Math.min((vw * 0.82) / SOUTH.w, (vh * 0.8) / SOUTH.h);
      const cB: [number, number] = [SOUTH.x + SOUTH.w * 0.5, SOUTH.y + SOUTH.h * 0.52];
      const s = Math.exp(Math.log(sA) + (Math.log(sB) - Math.log(sA)) * e);
      const k = (s - sA) / (sB - sA || 1);
      const cx = cA[0] + (cB[0] - cA[0]) * k, cy = cA[1] + (cB[1] - cA[1]) * k;
      const tx = vw / 2 - cx * s, ty = vh / 2 - cy * s + (narrow ? 90 : 30);
      w.style.width = `${STATE.w * s}px`; w.style.height = `${STATE.h * s}px`;
      w.style.transform = `translate(${tx}px, ${ty}px)`;
      const scr = (b: [number, number]): [number, number] => [tx + b[0] * s, ty + b[1] * s];
      // pins in screen space; South Florida pins fan apart when they would overlap
      const zoomedIn = e > 0.42;
      const pts = items.map((it) => scr(base(it.coords[0], it.coords[1])));
      const south = items.map((it, i) => (inSouth(it.coords) ? i : -1)).filter((i) => i >= 0);
      if (zoomedIn) {
        for (let pass = 0; pass < 12; pass++)
          for (const i of south) for (const j of south) {
            if (j <= i) continue;
            let dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1]; let d = Math.hypot(dx, dy);
            if (d >= 40) continue; if (d < 1e-3) { dx = 1; dy = 0; d = 1; }
            const push = (40 - d) / 2;
            pts[i] = [pts[i][0] - (dx / d) * push, pts[i][1] - (dy / d) * push];
            pts[j] = [pts[j][0] + (dx / d) * push, pts[j][1] + (dy / d) * push];
          }
      }
      items.forEach((it, i) => {
        const el = pinRefs.current[it.name];
        if (!el) return;
        const hide = inSouth(it.coords) && !zoomedIn;
        el.style.transform = `translate(${pts[i][0]}px, ${pts[i][1]}px)`;
        el.style.opacity = hide ? "0" : "1";
        el.style.pointerEvents = hide ? "none" : "auto";
        if (cardFor.current === it.name && !hide) setCard((c) => (c && c.it.name === it.name && Math.abs(c.x - pts[i][0]) + Math.abs(c.y - pts[i][1]) < 0.5 ? c : { it, x: pts[i][0], y: pts[i][1] }));
      });
      if (clusterRef.current) {
        const m = south.reduce((a, i) => [a[0] + pts[i][0] / south.length, a[1] + pts[i][1] / south.length], [0, 0]);
        clusterRef.current.style.transform = `translate(${m[0]}px, ${m[1]}px)`;
        clusterRef.current.style.opacity = zoomedIn ? "0" : "1";
        clusterRef.current.style.pointerEvents = zoomedIn ? "none" : "auto";
      }
      if (officeRef.current) {
        const o = scr(base(OFFICE[0], OFFICE[1]));
        officeRef.current.style.transform = `translate(${o[0]}px, ${o[1]}px)`;
        officeRef.current.style.opacity = String(clamp((e - 0.55) / 0.3));
      }
      CITIES.forEach((c, i) => {
        const el = cityRefs.current[i];
        if (!el) return;
        const q = scr(base(c.c[0], c.c[1]));
        el.style.transform = `translate(${q[0]}px, ${q[1]}px)`;
        el.style.opacity = String(c.zoomed ? clamp((e - 0.6) / 0.3) * 0.85 : clamp(1 - e / 0.35) * 0.8);
      });
    };
    redraw.current = update;
    const onResize = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("resize", onResize);
    // the fly-in plays by itself the first time the map comes into view; scrolling is never held
    let played = false;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !played) { played = true; window.setTimeout(() => { if (zoom.current === 0) flyTo(1); }, 900); }
    }, { threshold: 0.55 });
    if (track.current && !reduced) io.observe(track.current);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); cancelAnimationFrame(anim.current); io.disconnect(); };
  }, [items]);

  const showCard = (it: ZItem) => {
    cardFor.current = it.name;
    const el = pinRefs.current[it.name];
    const m = el?.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
    if (m) setCard({ it, x: parseFloat(m[1]), y: parseFloat(m[2]) });
  };
  const hideCard = () => { cardFor.current = null; setCard(null); };

  return (
    <div ref={track} className="fpz-track">
      <div className="fpz-sticky">
        <div ref={view} className="fpz-view" onMouseLeave={hideCard} onClick={(e) => { const t = e.target as HTMLElement; if (!t.closest(".fpz-pin, .fpz-card, .fpz-cluster, .fpz-controls")) hideCard(); }}>
          <div ref={world} className="fpz-world" style={{ width: STATE.w, height: STATE.h }}>
            <img className="fpz-state" src="/assets/map/fl-state.webp" alt="" loading="lazy" style={{ left: 0, top: 0, width: "100%", height: "100%" }} />
            <img className="fpz-south" src="/assets/map/fl-south.webp" alt="" loading="lazy" style={{ left: `${(SOUTH.x / STATE.w) * 100}%`, top: `${(SOUTH.y / STATE.h) * 100}%`, width: `${(SOUTH.w / STATE.w) * 100}%`, height: `${(SOUTH.h / STATE.h) * 100}%` }} />
          </div>
          {CITIES.map((c, i) => <span key={c.name + i} ref={(el) => { cityRefs.current[i] = el; }} className={`fpz-city${c.zoomed ? " below" : ""}${c.c[0] > 30 ? " north" : ""}`}>{c.name}</span>)}
          <div ref={officeRef} className="fpz-office" aria-hidden="true"><i /><span>ADG office</span></div>
          <button ref={clusterRef} className="fpz-cluster" aria-label={`${southItems.length} projects in South Florida`}
            onClick={() => flyTo(1)}>
            {southItems.length}
          </button>
          {items.map((it) => (
            <button
              key={it.name}
              ref={(el) => { pinRefs.current[it.name] = el; }}
              className={`fpz-pin ${it.kind}${card?.it.name === it.name ? " is-active" : ""}`}
              aria-label={`${it.name}, ${it.location}. ${it.units}`}
              onMouseEnter={() => showCard(it)}
              onFocus={() => showCard(it)}
              onPointerDown={(e) => { lastPointer.current = e.pointerType; cardWasOpen.current = cardFor.current === it.name; }}
              onClick={() => {
                // touch: the first tap shows the photo card, a second tap (or tapping the card) opens the project.
                // Decided from the state at touch-down, because a tap also fires focus/mouseenter before click.
                if (lastPointer.current !== "mouse" && !cardWasOpen.current) { showCard(it); return; }
                onSelect(it.name);
              }}
            >
              <span />
            </button>
          ))}
          {card && (
            <button className={`fpz-card ${card.y > (view.current?.clientHeight ?? 800) * 0.5 ? "at-top" : "at-bottom"}`} style={{ transform: `translate(${card.x}px, ${card.y}px)` }} onClick={() => onSelect(card.it.name)} aria-label={`${card.it.name}: view details`}>
              <img src={card.it.image} alt="" />
              <span className="fpz-card-body">
                <small className={card.it.kind}>{card.it.kind === "lp" ? "Investment" : "Development"}</small>
                <strong>{card.it.name}</strong>
                <em>{card.it.location} · {card.it.units}</em>
                <b>View details</b>
              </span>
            </button>
          )}
        </div>
        <div className="wrap fpz-head">
          <p className="eyebrow light">Our Footprint</p>
          <h2>Across <em>Florida.</em></h2>
          <ul className="fpz-legend">
            <li><i className="project" />Developments</li>
            <li><i className="lp" />Investments</li>
          </ul>
        </div>
        <div className="fpz-controls" role="group" aria-label="Map view">
          <button aria-pressed={target === 0} className={target === 0 ? "on" : ""} onClick={() => flyTo(0)}>Florida</button>
          <button aria-pressed={target === 1} className={target === 1 ? "on" : ""} onClick={() => flyTo(1)}>South Florida</button>
        </div>
        <p className="fpz-credit">Imagery: Sentinel-2 cloudless 2016 by EOX IT Services GmbH (s2maps.eu), contains modified Copernicus Sentinel data.</p>
      </div>
    </div>
  );
}
