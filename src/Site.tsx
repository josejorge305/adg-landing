import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { projects, limitedPartnerPositions, stats, taglines, leaders, type Leader } from "./data";
import { ZoomMap } from "./ZoomMap";
import { hq } from "./hq";

const WEB3FORMS_KEY = "fea77824-b299-49c9-b114-52bb347f7fd6";
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IMG = "/assets/images/website/";

/* Site theme: light (day hero) or dark (dusk hero). Set before paint by index.html; the nav toggle flips it.
   The Aura Living card always shows the opposite scene from the hero. */
const THEME_KEY = "adg-theme";
let heroNight = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
const nightSubs = new Set<() => void>();
const applyTheme = (dark: boolean, save: boolean) => {
  heroNight = dark;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  if (save) { try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch { /* storage blocked */ } }
  nightSubs.forEach((f) => f());
};
const setHeroNight = (dark: boolean) => applyTheme(dark, true);
if (typeof window !== "undefined") {
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
      if (!saved) applyTheme(e.matches, false);
    });
  } catch { /* old browsers */ }
}
const useHeroNight = () => useSyncExternalStore((f) => { nightSubs.add(f); return () => { nightSubs.delete(f); }; }, () => heroNight, () => false);
/* the popup panel's own color (light or dark theme), at a given opacity, for the expand/collapse fade */
const panelBg = (el: Element, a: number) => {
  const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g) ?? ["255", "255", "255"];
  return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${a})`;
};
const AURA_DAY = { video: "/assets/site/aura-living-day-loop-t.mp4", poster: "/assets/site/aura-living-day-loop-t-still.jpg" };

type Stat = { label: string; value: string };
type Item = {
  kind: "project" | "lp";
  name: string; location: string; address: string; coords: [number, number];
  units: string; type: string; status?: string; role?: string; description: string;
  stats: Stat[]; award: string | null; image: string; gallery: string[]; video?: string; poster?: string; sponsor?: string;
};
/* Detail-view descriptions: what is distinctive (type, units and place are shown in the term strip) */
const DETAIL_TEXT: Record<string, string> = {
  "Aura Living": "An eight-story mid-rise of one-, two- and three-bedroom residences for households at or below 60% AMI, and the third phase of ADG\u2019s Naranja neighborhood.",
  "Aura at Silver Lakes": "Garden-style two-, three- and four-bedroom residences for households at or below 60% AMI, serving the Lake County workforce.",
  "Alcazar Millennium": "The fourth phase of ADG\u2019s Naranja neighborhood, extending the community established by Alcazar Apartment Villas and Aura Living.",
  "Alcazar Apartment Villas": "An award-winning community of twelve buildings with one-, two- and three-bedroom residences and a resort-style clubhouse, delivered in two phases.",
  "Spring Gardens": "An eight-story rental community in the Miami Health District, developed in joint venture with The Estate Companies, with ADG as general partner.",
  "SOMI Homes": "Three custom single-family residences, taken from site acquisition and land evaluation through feasibility, construction financing, vertical construction oversight and disposition.",
  "The Holly by Soleste": "Two towers of eight and twelve stories adjacent to Young Circle in downtown Hollywood, structured as a Qualified Opportunity Zone investment.",
  "Gran Vista at Doral": "A gated community completed in 2015, with a resort-style pool, clubhouse and fitness center.",
  "Viva Tampa": "A garden-style community acquired in 2025 for a value-add renovation.",
};
/* One distinctive line per card (the full description lives in the detail view) */
const TAGLINES: Record<string, string> = {
  "Aura Living": "An eight-story mid-rise of one- to three-bedroom residences for households at or below 60% AMI.",
  "Alcazar Millennium": "The fourth phase of ADG\u2019s Naranja neighborhood.",
  "Alcazar Apartment Villas": "An award-winning community of twelve buildings with a resort-style clubhouse.",
  "Aura at Silver Lakes": "Garden-style two- to four-bedroom residences for households at or below 60% AMI.",
  "Spring Gardens": "A rental community in the Miami Health District, developed in joint venture with The Estate Companies.",
  "SOMI Homes": "Three custom residences, taken from site acquisition through construction and disposition.",
};
/* Portfolio collage order: long, short / short, long / full width */
const ORDER = ["Aura Living", "Alcazar Millennium", "Alcazar Apartment Villas", "Aura at Silver Lakes", "Spring Gardens", "SOMI Homes"];
const LAYOUT: Record<string, "wide" | "full" | "pano" | undefined> = { "Aura Living": "wide", "Aura at Silver Lakes": "wide", "Spring Gardens": "full", "SOMI Homes": "pano" };
const PROJECTS: Item[] = projects
  .map((p) => ({ ...p, kind: "project" as const, image: hq(p.image), gallery: (p.gallery as string[]).map(hq), video: (p as { video?: string }).video, poster: (p as { poster?: string }).poster }))
  .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
const LPS: Item[] = limitedPartnerPositions.map((p) => ({ ...p, kind: "lp" as const, image: hq(p.image), gallery: (p.gallery as string[]).map(hq), sponsor: (p as { sponsor?: string }).sponsor }));
const ALL: Item[] = [...PROJECTS, ...LPS];
const MAP_ITEMS = ALL.map((x) => ({ name: x.name, location: x.location, units: x.units, coords: x.coords, kind: x.kind, image: x.image }));

/* "BREAKING GROUND Q1 2027" -> "Breaking ground Q1 2027" (display only; the data is unchanged) */
function sentence(s: string) {
  return s.split(" ").map((w, i) => (/^Q\d$/.test(w) ? w : i === 0 ? w.charAt(0) + w.slice(1).toLowerCase() : w.toLowerCase())).join(" ");
}
function statusTone(s = "") {
  if (/SOLD|DELIVERED/.test(s)) return "sold";
  if (/STABILIZED/.test(s)) return "stable";
  return "active";
}

/* ---------------- Hero: plans to built ---------------- */
function Hero() {
  const [phase, setPhase] = useState<"intro" | "reveal" | "done">(() => {
    try { if (reducedMotion() || document.visibilityState !== "visible") return "done"; } catch { return "done"; }
    return "intro";
  });
  useEffect(() => {
    if (phase === "intro") { const t = window.setTimeout(() => setPhase("reveal"), 2300); return () => window.clearTimeout(t); }
    if (phase === "reveal") { const t = window.setTimeout(() => setPhase("done"), 1500); return () => window.clearTimeout(t); }
  }, [phase]);
  const t = taglines[0];
  const night = useHeroNight(); // dark theme shows the dusk hero
  const base = night ? "/assets/site/hero-dusk" : "/assets/site/hero";
  const heroVideo = useRef<HTMLVideoElement>(null);
  // Framing on wide screens: trim the open sky above the roofline first (never past it), then the bottom,
  // so both the roof and the street stay in view.
  const heroEl = useRef<HTMLElement>(null);
  useEffect(() => {
    const h = heroEl.current;
    if (!h) return;
    const SKY = 0.1;
    const set = () => {
      const W = h.clientWidth, H = h.clientHeight;
      const shown = 9 * Math.max(W / 16, H / 9), crop = shown - H;
      const pos = crop > 1 ? (Math.min(crop, shown * SKY) / crop) * 100 : 50;
      h.style.setProperty("--hero-pos-y", `${pos.toFixed(1)}%`);
    };
    set();
    const ro = new ResizeObserver(set); ro.observe(h);
    return () => ro.disconnect();
  }, []);
  const [motion] = useState(() => typeof window !== "undefined" && !reducedMotion() && window.innerWidth > 760);
  // the scene starts moving as the render dissolves in under the line drawing (reveal), not after it
  const motionGo = phase !== "intro";
  useEffect(() => {
    const v = heroVideo.current;
    if (!v || !motionGo) return;
    v.muted = true;
    let timer = 0;
    const play = () => { v.classList.remove("settling"); v.classList.add("on"); v.currentTime = 0; v.play().catch(() => {}); };
    const onEnded = () => {
      v.classList.add("settling");
      timer = window.setTimeout(() => { v.classList.remove("on"); v.currentTime = 0; timer = window.setTimeout(play, REST_MS); }, SETTLE_MS);
    };
    v.addEventListener("ended", onEnded);
    play();                                                   // starts with the dissolve: no still pause
    return () => { v.removeEventListener("ended", onEnded); window.clearTimeout(timer); };
  }, [motionGo, night]);
  return (
    <section ref={heroEl} className={`hero hero-${phase}${night ? " hero-night" : " hero-day"}`} id="home">
      <picture>
        <source srcSet={`${base}.webp`} type="image/webp" />
        <img className="hero-img" src={`${base}.jpg`} alt="" aria-hidden="true" {...{ fetchpriority: "high" }} />
      </picture>
      {motion && (
        <video ref={heroVideo} className="hero-video" src={night ? "/assets/site/hero-dusk-v3.mp4" : "/assets/site/hero-day-v2.mp4"} poster={`${base}.jpg`} muted playsInline preload="auto" aria-hidden="true" />
      )}
      <div className="hero-lines" aria-hidden="true">
        <picture>
          <source srcSet={`${base}-lines.webp`} type="image/webp" />
          <img src={`${base}-lines.png`} alt="" />
        </picture>
      </div>
      <div className="hero-sweep" aria-hidden="true" />
      <div className="hero-shade" />
      <div className="wrap hero-content">
        <p className="eyebrow light">Workforce Housing Developer — Florida</p>
        <h1>
          {t.top} <em>{t.accent}</em>
          <br />
          {t.bottom}
        </h1>
        <p className="hero-lede">
          ADG develops
          workforce communities that close the gap between income and rent — built to institutional standards,
          designed for real life.
        </p>
      </div>
      <div className="hero-stats" aria-label="Firm figures">
        <div className="wrap hero-stats-inner">
          {stats.map((s) => (
            <div key={s.label} className="hero-stat">
              <p className="hero-stat-num"><CountUp value={s.number} /></p>
              <p className="hero-stat-label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Count-up figures ---------------- */
function CountUp({ value }: { value: string }) {
  const m = value.match(/^([^0-9]*)([0-9,.]+)(.*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : 0;
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || !m) return;
    if (reducedMotion()) { setN(target); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 1600);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [target]);
  if (!m) return <span>{value}</span>;
  const suffix = m[3];
  const plus = suffix.endsWith("+");
  return (
    <span ref={ref}>
      {m[1]}{n.toLocaleString()}{plus ? suffix.slice(0, -1) : suffix}
      {plus && <span className="stat-plus">+</span>}
    </span>
  );
}

/* Every portfolio video "breathes": it plays when in view, dissolves softly into its first frame,
   rests, then plays again. The rest frame is the video's own first frame, so the restart is invisible.
   Reduced-motion visitors see the still frame only. */
const SETTLE_MS = 1600, REST_MS = 3500;
/* card clips start just after the generator's extra-sharp first frame; the still is that exact frame */
const LOOP_START = 0;
function LoopVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion()) return;
    v.muted = true;
    let timer = 0, visible = false, resting = false;
    const play = () => { if (!visible) return; resting = false; v.classList.remove("settling"); v.currentTime = LOOP_START; v.play().catch(() => {}); };
    const onEnded = () => {
      resting = true;
      v.classList.add("settling");                                   // fade the video out over the still
      timer = window.setTimeout(() => { v.currentTime = LOOP_START; timer = window.setTimeout(play, REST_MS); }, SETTLE_MS);
    };
    v.addEventListener("ended", onEnded);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !resting && v.paused) play();
      if (!visible) { v.pause(); }
    }, { threshold: 0.35 });
    io.observe(v);
    // hovering the card starts the animation right away (from the top if it was resting)
    const card = v.closest(".pcard");
    const onEnter = () => {
      visible = true;
      if (resting || v.ended || v.classList.contains("settling")) { window.clearTimeout(timer); play(); }
      else if (v.paused) v.play().catch(() => {});
    };
    card?.addEventListener("mouseenter", onEnter);
    return () => { io.disconnect(); v.removeEventListener("ended", onEnded); window.clearTimeout(timer); card?.removeEventListener("mouseenter", onEnter); };
  }, [src]);
  return (
    <>
      <img className="lv-still" src={poster} alt="" aria-hidden="true" />
      <video ref={ref} className="lv-video" src={src} poster={poster} muted playsInline preload="metadata" aria-label={label} />
    </>
  );
}

/* ---------------- Portfolio card ---------------- */
function Card({ item, layout, index = 0, onOpen }: { item: Item; layout?: "wide" | "full" | "pano"; index?: number; onOpen: (el: Element | null) => void }) {
  const badge = item.kind === "lp" ? item.role! : sentence(item.status || "");
  const excerpt = TAGLINES[item.name] ?? item.description;
  const spec = [item.type, item.units, item.location.split(",")[0]].filter(Boolean).join(" \u00b7 ");
  const night = useHeroNight();
  const swap = night && item.name === "Aura Living" && item.video;
  const video = swap ? AURA_DAY.video : item.video;
  const poster = swap ? AURA_DAY.poster : (item.poster ?? item.image);
  return (
    <article
      className={`pcard${layout ? " " + layout : ""}`}
      data-name={item.name}
      style={{ ["--i" as string]: index } as React.CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}: view details`}
      onClick={(e) => onOpen(e.currentTarget.querySelector(".pcard-img"))}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(e.currentTarget.querySelector(".pcard-img")); } }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      <div className="pcard-img">
        {video
          ? <LoopVideo src={video} poster={poster} label={`${item.name}, animated view`} />
          : <img src={item.image} alt={`${item.name}, ${item.location}`} loading="lazy" />}
      </div>
      <div className="pcard-body">
        <p className={`pill ${item.kind === "lp" ? "lp" : statusTone(item.status)}`}>{badge}</p>
        <h3><span>{item.name}</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></h3>
        <p className="pcard-spec">{spec}</p>
        {excerpt && <p className="pcard-desc">{excerpt}</p>}
      </div>
    </article>
  );
}

/* ---------------- Detail view ---------------- */
function DetailModal({ it, list, origin, onClosed, onStep }: {
  it: Item; list: Item[]; origin: DOMRect | null; onClosed: () => void; onStep: (dir: 1 | -1) => void;
}) {
  const gallery = [...(it.video ? [it.video] : []), ...(it.gallery.length ? it.gallery : it.video ? [] : [it.image])];
  const [gi, setGi] = useState(0);
  // stepping to a project with fewer slides must never point past its gallery
  const g = gi < gallery.length ? gi : 0;
  useEffect(() => { setGi(0); }, [it.name]);
  const i = list.findIndex((x) => x.name === it.name);
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  const panel = useRef<HTMLDivElement>(null), media = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null), back = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const name = useRef(it.name); name.current = it.name;
  useLayoutEffect(() => {
    const p = panel.current, m = media.current, b = body.current;
    if (!p || !m || !b || reducedMotion()) return;
    if (!origin) { p.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: EASE }); return; }
    const end = m.getBoundingClientRect();
    p.style.overflow = "visible";
    const a = m.animate([{ transform: `translate(${origin.left - end.left}px, ${origin.top - end.top}px) scale(${origin.width / end.width}, ${origin.height / end.height})` }, { transform: "none" }], { duration: 460, easing: EASE });
    p.animate([{ backgroundColor: panelBg(p, 0), boxShadow: "none" }, { backgroundColor: panelBg(p, 1) }], { duration: 360, easing: "ease-out" });
    b.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 160, easing: EASE, fill: "backwards" });
    close.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 260, fill: "backwards" });
    a.onfinish = () => { p.style.overflow = ""; };
  }, []);
  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    const p = panel.current, m = media.current, b = body.current;
    if (reducedMotion() || !p || !m || !b) { onClosed(); return; }
    back.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, fill: "forwards" });
    const el = document.querySelector(`.pcard[data-name="${CSS.escape(name.current)}"] .pcard-img, .lp-row[data-name="${CSS.escape(name.current)}"] .lp-thumb`);
    const r = el?.getBoundingClientRect();
    if (r && r.bottom > 0 && r.top < window.innerHeight) {
      const f = m.getBoundingClientRect();
      p.style.overflow = "visible";
      b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
      close.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      p.animate([{ backgroundColor: panelBg(p, 1) }, { backgroundColor: panelBg(p, 0), boxShadow: "none" }], { duration: 220, fill: "forwards" });
      const a = m.animate([{ transform: "none" }, { transform: `translate(${r.left - f.left}px, ${r.top - f.top}px) scale(${r.width / f.width}, ${r.height / f.height})` }], { duration: 420, easing: EASE, fill: "forwards" });
      a.onfinish = onClosed;
    } else {
      const a = p.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(12px)" }], { duration: 240, fill: "forwards" });
      a.onfinish = onClosed;
    }
  };
  const cb = useRef({ requestClose, onStep, gallery });
  cb.current = { requestClose, onStep, gallery };
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current.requestClose();
      if (e.key === "ArrowRight") cb.current.onStep(1);
      if (e.key === "ArrowLeft") cb.current.onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    const ov = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ov; prevFocus?.focus(); };
  }, []);
  const tomb: [string, string][] = [["Type", it.type], ["Units", it.units], [it.kind === "lp" ? "Role" : "Status", it.kind === "lp" ? it.role! : sentence(it.status || "")]];
  const place = it.location.split(",")[0];
  const locLine = !it.address ? it.location : it.address.includes(place) ? it.address : `${it.location} \u00b7 ${it.address}`;
  const maps = `https://www.google.com/maps/search/?api=1&query=${it.coords[0]},${it.coords[1]}`;
  return (
    <div className="dm" role="dialog" aria-modal="true" aria-labelledby="dm-title">
      <div ref={back} className="dm-backdrop" onClick={requestClose} />
      <div ref={panel} className="dm-panel">
        <button ref={close} className="dm-close" onClick={requestClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div ref={media} className="dm-media">
          {gallery[g].endsWith(".mp4")
            ? <LoopVideo key={gallery[g]} src={gallery[g]} poster={it.poster ?? it.image} label={`${it.name}, animated view`} />
            : <img key={gallery[g]} src={gallery[g]} alt={`${it.name}, image ${gi + 1} of ${gallery.length}`} />}
          {gallery.length > 1 && (
            <div className="dm-gal">
              <button onClick={() => setGi((g - 1 + gallery.length) % gallery.length)} aria-label="Previous image">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <span>{g + 1} / {gallery.length}</span>
              <button onClick={() => setGi((g + 1) % gallery.length)} aria-label="Next image">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
        </div>
        <div ref={body} className="dm-body">
          <div className="dm-swap" key={it.name}>
            <h2 id="dm-title">{it.name}</h2>
            <p className="dm-sub">{locLine}</p>
            <dl className="dm-tomb">{tomb.filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <div className="dm-cols">
            <div className="dm-main">
            <p className="dm-desc">{DETAIL_TEXT[it.name] ?? it.description}</p>
            {it.award && <p className="dm-award">{it.award}</p>}
            <p className="dm-loc"><a href={maps} target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
            </div>
            <aside className="dm-side">
            {(it.stats.length > 0 || it.sponsor) && (
              <dl className="dm-facts">{[...(it.sponsor ? [{ label: "Sponsor", value: it.sponsor }] : []), ...it.stats].filter((x) => !tomb.some(([k, v]) => v && (x.label === k || x.value.toLowerCase() === v.toLowerCase() || x.value === v.split(" ")[0]))).map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
            )}
            </aside>
            </div>
          </div>
          {list.length > 1 && (
            <div className="dm-nav">
              <button className="dm-step" onClick={() => onStep(-1)} aria-label={`Previous: ${prev.name}`}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span><small>Previous</small>{prev.name}</span>
              </button>
              <button className="dm-step next" onClick={() => onStep(1)} aria-label={`Next: ${next.name}`}>
                <span><small>Next</small>{next.name}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Investment positions table ---------------- */
function LpTable({ items, onOpen }: { items: Item[]; onOpen: (name: string, el: Element | null) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(false);
  // rows draw in when the table enters view
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (reducedMotion() || !("IntersectionObserver" in window)) { setDrawn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className={`lp-table${drawn ? " is-drawn" : ""}`} role="table" aria-label="Investment positions" onMouseLeave={() => setActive(null)}>
      <div className="lp-head" role="row">
        <span role="columnheader">Property</span>
        <span role="columnheader">Location</span>
        <span role="columnheader">Sponsor</span>
        <span role="columnheader">Asset type</span>
        <span role="columnheader" className="num">Units</span>
        <span aria-hidden="true" />
      </div>
      {items.map((p, i) => (
        <button key={p.name} className={`lp-row${active === p.name ? " is-active" : ""}`} role="row" data-name={p.name}
          style={{ ["--i" as string]: i } as React.CSSProperties} aria-label={`${p.name}: view details`}
          onMouseEnter={() => setActive(p.name)}
          onFocus={() => setActive(p.name)} onBlur={() => setActive(null)}
          onClick={(e) => onOpen(p.name, e.currentTarget.querySelector(".lp-thumb"))}>
          <span className="lp-prop" role="cell">
            <span className="lp-thumb"><img src={p.image} alt="" loading="lazy" /></span>
            <span className="lp-name"><strong>{p.name}</strong><em>{p.role}</em></span>
          </span>
          <span className="lp-loc" role="cell">{p.location}</span>
          <span className={`lp-sponsor${p.sponsor ? "" : " none"}`} role="cell">{p.sponsor ?? "—"}</span>
          <span className="lp-type" role="cell">{p.type}</span>
          <span className="lp-units num" role="cell">{p.units.replace(/\s*Units?$/i, "")}</span>
          <span className="lp-go" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Leadership: portrait grid and profile dossier ---------------- */
function LeaderCard({ l, onOpen }: { l: Leader; onOpen: (el: Element | null) => void }) {
  return (
    <button className="lead-card" data-name={l.name} onClick={(e) => onOpen(e.currentTarget.querySelector(".lead-photo"))} aria-label={`${l.name}, ${l.title}: view profile`}>
      <span className="lead-photo"><img src={l.portrait} alt="" loading="lazy" /></span>
      <span className="lead-meta">
        <strong><span>{l.name}</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></strong>
        <em>{l.title}</em>
      </span>
    </button>
  );
}

function LeaderModal({ l, list, origin, onClosed, onStep }: { l: Leader; list: Leader[]; origin: DOMRect | null; onClosed: () => void; onStep: (d: 1 | -1) => void }) {
  const panel = useRef<HTMLDivElement>(null), photo = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null), back = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const cur = useRef(l.name); cur.current = l.name;
  const [drawn, setDrawn] = useState(false);
  const i = list.findIndex((x) => x.name === l.name);
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  // the career line draws itself each time a profile is shown
  useEffect(() => {
    setDrawn(false);
    if (body.current) body.current.scrollTop = 0;
    const t = window.setTimeout(() => setDrawn(true), reducedMotion() ? 0 : 450);
    return () => window.clearTimeout(t);
  }, [l.name]);
  useLayoutEffect(() => {
    const p = panel.current, ph = photo.current, b = body.current;
    if (!p || !ph || !b || reducedMotion()) return;
    if (!origin) { p.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: EASE }); return; }
    const end = ph.getBoundingClientRect();
    p.style.overflow = "visible";
    const a = ph.animate([{ transform: `translate(${origin.left - end.left}px, ${origin.top - end.top}px) scale(${origin.width / end.width}, ${origin.height / end.height})` }, { transform: "none" }], { duration: 520, easing: EASE });
    p.animate([{ backgroundColor: panelBg(p, 0), boxShadow: "none" }, { backgroundColor: panelBg(p, 1) }], { duration: 380, easing: "ease-out" });
    b.animate([{ opacity: 0, transform: "translateX(16px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: 200, easing: EASE, fill: "backwards" });
    close.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: 300, fill: "backwards" });
    a.onfinish = () => { p.style.overflow = ""; };
  }, []);
  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    const p = panel.current, ph = photo.current, b = body.current;
    if (reducedMotion() || !p || !ph || !b) { onClosed(); return; }
    back.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, fill: "forwards" });
    const el = document.querySelector(`.lead-card[data-name="${CSS.escape(cur.current)}"] .lead-photo`);
    const r = el?.getBoundingClientRect();
    if (r && r.bottom > 0 && r.top < window.innerHeight) {
      const f = ph.getBoundingClientRect();
      p.style.overflow = "visible";
      b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
      close.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
      p.animate([{ backgroundColor: panelBg(p, 1) }, { backgroundColor: panelBg(p, 0), boxShadow: "none" }], { duration: 220, fill: "forwards" });
      const a = ph.animate([{ transform: "none" }, { transform: `translate(${r.left - f.left}px, ${r.top - f.top}px) scale(${r.width / f.width}, ${r.height / f.height})` }], { duration: 440, easing: EASE, fill: "forwards" });
      a.onfinish = onClosed;
    } else {
      const a = p.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(12px)" }], { duration: 240, fill: "forwards" });
      a.onfinish = onClosed;
    }
  };
  const cb = useRef({ requestClose, onStep }); cb.current = { requestClose, onStep };
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current.requestClose();
      if (e.key === "ArrowRight") cb.current.onStep(1);
      if (e.key === "ArrowLeft") cb.current.onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    const ov = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ov; prevFocus?.focus(); };
  }, []);
  return (
    <div className="dm lm" role="dialog" aria-modal="true" aria-labelledby="lm-title">
      <div ref={back} className="dm-backdrop" onClick={requestClose} />
      <div ref={panel} className="lm-panel">
        <button ref={close} className="dm-close" onClick={requestClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div ref={photo} className="lm-photo"><img key={l.portrait} src={l.portrait} alt={l.name} /></div>
        <div ref={body} className="lm-body">
          <div className="lm-swap" key={l.name}>
            <p className="eyebrow">Leadership</p>
            <h2 id="lm-title">{l.name}</h2>
            <p className="lm-title">{l.title} · Alcazar Development Group</p>
            <ul className="lm-glance">{l.glance.map((g) => <li key={g}>{g}</li>)}</ul>
            <div className="lm-bio">{l.bio.map((p, k) => <p key={k}>{p}</p>)}</div>
          </div>
          <div className="dm-nav">
            <button className="dm-step" onClick={() => onStep(-1)} aria-label={`Previous: ${prev.name}`}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span><small>Previous</small>{prev.name}</span>
            </button>
            <button className="dm-step next" onClick={() => onStep(1)} aria-label={`Next: ${next.name}`}>
              <span><small>Next</small>{next.name}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export function Site() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Phones: a portrait turns to color while it passes through the middle of the screen, then returns to black and white
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia("(hover: none)").matches || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("in-focus", e.isIntersecting)),
      { rootMargin: "-38% 0px -38% 0px" }
    );
    const t = window.setTimeout(() => document.querySelectorAll(".lead-card").forEach((c) => io.observe(c)), 300);
    return () => { window.clearTimeout(t); io.disconnect(); };
  }, []);
  const [nav, setNav] = useState({ scrolled: false, hidden: false });
  const [open, setOpen] = useState<string | null>(null);
  const [leader, setLeader] = useState<string | null>(null);
  const leaderOrigin = useRef<DOMRect | null>(null);
  const openLeader = (name: string, el: Element | null) => { leaderOrigin.current = el ? el.getBoundingClientRect() : null; setLeader(name); };
  const leaderIt = leader ? leaders.find((x) => x.name === leader) ?? null : null;
  const stepLeader = (d: 1 | -1) => {
    if (!leaderIt) return;
    const k = leaders.findIndex((x) => x.name === leaderIt.name);
    setLeader(leaders[(k + d + leaders.length) % leaders.length].name);
  };
  const origin = useRef<DOMRect | null>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const [glow, setGlow] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [trap, setTrap] = useState(false);
  const progress = useRef<HTMLDivElement>(null);

  const openItem = (name: string, el: Element | null) => { origin.current = el ? el.getBoundingClientRect() : null; setOpen(name); };
  const openIt = open ? ALL.find((x) => x.name === open) ?? null : null;
  const list = openIt ? (openIt.kind === "lp" ? LPS : PROJECTS) : [];
  const step = (dir: 1 | -1) => {
    if (!openIt) return;
    const i = list.findIndex((x) => x.name === openIt.name);
    setOpen(list[(i + dir + list.length) % list.length].name);
  };
  const go = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" }); };

  // Scroll: glass nav, progress line, and the shovel glint
  useEffect(() => {
    let last = window.scrollY, raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const hidden = !reducedMotion() && y > 160 && y > last + 2 ? true : y < last - 2 || y <= 160 ? false : null;
      last = y;
      setNav((s) => { const h = hidden === null ? s.hidden : hidden; return s.scrolled === y > 8 && s.hidden === h ? s : { scrolled: y > 8, hidden: h }; });
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current) progress.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (aboutRef.current) {
        const r = aboutRef.current.getBoundingClientRect(), vh = window.innerHeight || 1;
        setGlow(Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);
  const glint = Math.pow(Math.abs(Math.sin(glow * Math.PI * 2.5)), 2);

  // Reveal and cascade
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .stagger"));
    if (reducedMotion() || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("is-visible")); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      if (e.target.classList.contains("stagger") && !e.target.classList.contains("is-visible"))
        Array.from(e.target.children).forEach((c, i) => (c as HTMLElement).animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 480, delay: i * 70, easing: EASE, fill: "backwards" }));
      e.target.classList.add("is-visible");
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach((e) => io.observe(e));
    const fs = window.setTimeout(() => els.forEach((e) => e.classList.add("is-visible")), 4000);
    return () => { io.disconnect(); window.clearTimeout(fs); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (trap) { setStatus("sent"); return; }
    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, from_name: "alcazardg.com contact form", subject: `Website inquiry: ${form.subject || form.name}`, name: form.name, email: form.email, replyto: form.email, topic: form.subject, message: form.message }),
      });
      const d = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (res.ok && d.success) { setStatus("sent"); setForm({ name: "", email: "", subject: "", message: "" }); } else setStatus("error");
    } catch { setStatus("error"); }
  };

  const links: [string, string][] = [["portfolio", "Portfolio"], ["investments", "Investments"], ["about", "About"], ["team", "Leadership"]];
  // which section the reader is in (drives the sliding underline)
  const [active, setActive] = useState("");
  useEffect(() => {
    const ids = ["portfolio", "investments", "about", "footprint", "team", "affiliates", "contact"];
    const map: Record<string, string> = { footprint: "about", affiliates: "team" };
    const onScroll = () => {
      const y = window.innerHeight * 0.35;
      let cur = "";
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= y) cur = map[id] ?? id; }
      setActive((a) => (a === cur ? a : cur));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dark = useHeroNight();
  const themeBtn = (where: "desk" | "mob") => (
    <button
      type="button"
      className={`nav-theme ${where}`}
      onClick={() => setHeroNight(!dark)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor" /></svg>
      )}
    </button>
  );
  return (
    <div className="page">
      <div ref={progress} className="scroll-progress" aria-hidden="true" />
      <header className={`nav${nav.scrolled ? " is-scrolled" : menuOpen ? "" : " on-hero"}${menuOpen ? " menu-open" : ""}${nav.hidden && !menuOpen ? " is-hidden" : ""}`}>
        <div className="wrap nav-inner">
          <a href="#home" className="nav-logo" aria-label="Alcazar Development Group, home" onClick={(e) => { e.preventDefault(); go("home"); }}>
            <img className="mark-dark" src="/assets/site/adg-mark.png" alt="" aria-hidden="true" />
            <img className="mark-light" src="/assets/site/adg-mark-light.png" alt="" aria-hidden="true" />
            <span className="nav-name">Alcazar Development Group</span>
          </a>
          <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main">
            {links.map(([id, label]) => <a key={id} href={`#${id}`} className={`nav-item${active === id ? " is-active" : ""}`} aria-current={active === id ? "true" : undefined} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>)}
            <a className="nav-signin" href="https://adg-os.com" aria-label="Sign in to ADG-OS">
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
              Sign in
            </a>
            {themeBtn("desk")}
            <a href="#contact" className={`nav-cta${active === "contact" ? " is-active" : ""}`} onClick={(e) => { e.preventDefault(); go("contact"); }}>Contact</a>
          </nav>
          {themeBtn("mob")}
          <button className={menuOpen ? "nav-toggle is-open" : "nav-toggle"} aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main>
        <Hero />

        <section id="portfolio" className="band tone">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Our Portfolio</p>
              <h2>Homes where <em>Florida's workforce</em> lives.</h2>
              <p className="section-sub">Affordable and market-rate communities developed across Florida, from garden‑style to Class A mid‑rise.</p>
            </div>
            <div className="pgrid dev stagger">
              {PROJECTS.map((p, i) => <Card key={p.name} item={p} index={i} layout={LAYOUT[p.name]} onOpen={(el) => openItem(p.name, el)} />)}
            </div>
          </div>
        </section>

        <section id="investments" className="band navy">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow light">Investment Portfolio</p>
              <h2>Capital positions <em>alongside established sponsors.</em></h2>
              <p className="section-sub">Limited partner positions in Class A and value‑add multifamily communities across Florida.</p>
            </div>
            <LpTable items={LPS} onOpen={openItem} />
          </div>
        </section>

        <section id="about" className="band" ref={aboutRef}>
          <div className="wrap about">
            <div className="about-copy reveal">
              <p className="eyebrow">About ADG</p>
              <h2>Closing the gap <em>between income and rent.</em></h2>
              <p>
                Across Florida, essential workers are being priced out of the communities they serve. Teachers commute
                hours to their schools. Nurses cannot afford to live near their hospitals. ADG was founded to change
                that — developing high-quality, attainable housing that keeps the workforce close to where it is needed most.
              </p>
              <p>
                Every project is built to institutional standards — the same rigor demanded by tax credit investors and
                agency lenders — because the workforce deserves the same quality of construction, amenities, and management
                as any luxury community.
              </p>
              <div className="award">
                <img src={dark ? "/assets/site/sfbj-award-light.png" : "/assets/site/sfbj-award-dark.png"} alt="SFBJ Structures Awards" />
                <div><strong>SFBJ Structures Awards</strong><span>Best Affordable Residential 2018</span></div>
              </div>
            </div>
            <div className="about-media reveal">
              <img src={hq(IMG + "closing-the-gap.jpg")} alt="ADG Groundbreaking Ceremony" loading="lazy" />
              {/* Sun reflection: a specular streak that slides across the shovel's polished surface as the page scrolls */}
              <div
                className="glint"
                style={{
                  left: `${20 + glow * 16}%`,
                  top: `${54 + glow * 20}%`,
                  transform: `translate(-50%, -50%) rotate(-24deg) scaleX(${0.75 + glint * 0.5})`,
                  opacity: 0.25 + glint * 0.7,
                }}
              />
            </div>
          </div>
        </section>

        <section id="footprint" className="fpz" aria-label="Our footprint across Florida">
          <ZoomMap items={MAP_ITEMS} onSelect={(n) => openItem(n, null)} />
        </section>

        <section id="team" className="band tone">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Leadership</p>
              <h2>The people behind <em>the mission.</em></h2>
              <p className="section-sub">Principals with decades of experience across development, banking and finance.</p>
            </div>
            <div className="lead-grid stagger">
              {leaders.map((l) => <LeaderCard key={l.name} l={l} onOpen={(el) => openLeader(l.name, el)} />)}
            </div>
          </div>
        </section>

        <section id="affiliates" className="band">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Affiliated Companies</p>
              <h2>Development, brokerage <em>and private lending.</em></h2>
              <p className="section-sub">ADG operates alongside two affiliated firms under common leadership.</p>
            </div>
            <div className="aff stagger">
              {[
                { href: "https://www.fhcp-llc.com", logo: IMG + "fhcp-logo-t.png", logoDark: IMG + "fhcp-logo-t-dark.png", domain: "fhcp-llc.com", spec: "Private lending \u00b7 Since 2011 \u00b7 NMLS #889341", name: "FH Capital Partners", desc: "Licensed private lender providing first-lien, asset-based loans on commercial and residential real estate in Florida." },
                { href: "https://reliantrealestategroup.com", logo: IMG + "reliant-logo-t.png", logoDark: IMG + "reliant-logo-t-dark.png", domain: "reliantrealestategroup.com", spec: "Commercial brokerage \u00b7 Since 2009", name: "Reliant Real Estate Group", desc: "Commercial real estate brokerage in Florida, covering acquisitions and dispositions, loan and note sales, and bank-owned property." },
              ].map((a) => (
                <a key={a.name} className="aff-card" href={a.href} target="_blank" rel="noopener noreferrer">
                  <div className="aff-logo"><img src={dark ? a.logoDark : a.logo} alt={a.name} /></div>
                  <div><strong>{a.name}</strong><p className="aff-spec">{a.spec}</p><p>{a.desc}</p><span className="aff-link">{a.domain}<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg></span></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="band navy contact">
          <div className="wrap contact-grid">
            <div className="reveal">
              <p className="eyebrow light">Get in Touch</p>
              <h2>Partner with ADG <em>on Florida&rsquo;s next community.</em></h2>
              <dl className="contact-list">
                <div><dt>Phone</dt><dd><a href="tel:3057726191">(305) 772-6191</a></dd></div>
                <div><dt>Office</dt><dd>7520 SW 57th Avenue Suite G{"\n"}South Miami, FL 33143</dd></div>
              </dl>
              <a className="office-map" href="https://www.google.com/maps/search/?api=1&query=7520+SW+57th+Avenue+Suite+G+South+Miami+FL+33143" target="_blank" rel="noopener noreferrer" aria-label="Get directions to the ADG office in Google Maps">
                <img src="/assets/map/office-snippet.webp" alt="" loading="lazy" />
                <span className="office-pin" style={{ left: "50.4%", top: "49.5%" }}><i /><b>ADG office</b></span>
                <span className="office-cta">Get directions<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              </a>
            </div>
            <form className="cform reveal" onSubmit={submit}>
              <fieldset className="cf-topics">
                <legend>What can we help with?</legend>
                <div>
                  {["Development partnership", "Land & site acquisition", "Capital & investment", "Residents & community", "Press"].map((t) => (
                    <button key={t} type="button" aria-pressed={form.subject === t} className={form.subject === t ? "on" : ""} onClick={() => setForm({ ...form, subject: form.subject === t ? "" : t })}>{t}</button>
                  ))}
                </div>
              </fieldset>
              <div className="cf-row">
                <label className="ff"><input name="name" required placeholder=" " autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><span>Name</span></label>
                <label className="ff"><input type="email" name="email" required placeholder=" " autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><span>Email</span></label>
              </div>
              <label className="ff"><textarea name="message" required rows={4} placeholder=" " value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /><span>Message</span></label>
              <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" checked={trap} onChange={(e) => setTrap(e.target.checked)} style={{ display: "none" }} aria-hidden="true" />
              <button type="submit" className="cf-send" disabled={status === "sending"}><span>{status === "sending" ? "Sending..." : "Send message"}</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <p className="cf-privacy">Your information is used only to respond to your inquiry and is never sold or shared.</p>
              {status === "sent" && (
                <p className="cform-status sent" role="status">
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" pathLength={1} /></svg>
                  Message sent. We will be in touch shortly.
                </p>
              )}
              {status === "error" && (
                <p className="cform-status" role="alert">
                  Your message could not be sent. Please email <a href="mailto:JJ@alcazardg.com">JJ@alcazardg.com</a> or call (305) 772-6191.
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <img src={IMG + "adg-logo.png"} alt="Alcazar Development Group" />
            <p>Workforce Housing Developer — Florida</p>
          </div>
          <div>
            <p className="footer-h">Office</p>
            <p>7520 SW 57th Avenue Suite G<br />South Miami, FL 33143</p>
            <p><a href="tel:3057726191">(305) 772-6191</a></p>
          </div>
          <nav aria-label="Footer">
            <p className="footer-h">Explore</p>
            {links.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>)}
          </nav>
          <div>
            <p className="footer-h">Platform</p>
            <a href="https://adg-os.com">ADG-OS Platform →</a>
          </div>
        </div>
        <div className="wrap footer-base">
          <p>© {new Date().getFullYear()} Alcazar Development Group, LLC</p>
          <div className="footer-legal">
            <svg className="eho" viewBox="0 0 32 32" width="26" height="26" role="img" aria-label="Equal Housing Opportunity"><path d="M16 3 2 13.5V29h28V13.5z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><rect x="9" y="15.5" width="14" height="3" fill="currentColor" /><rect x="9" y="21" width="14" height="3" fill="currentColor" /></svg>
            <p>
              Equal Housing Opportunity. Information on this site is provided for general purposes only and does not constitute an offer to sell,
              or a solicitation of an offer to buy, any security or interest in any investment. Renderings and animations are artist&rsquo;s
              conceptions; actual design, materials and features may differ. Project timelines, unit counts and status are estimates and subject
              to change. Investment property images courtesy of their respective sponsors. Map imagery: Sentinel-2 cloudless 2016 by
              EOX IT Services GmbH (s2maps.eu), contains modified Copernicus Sentinel data.
            </p>
          </div>
        </div>
      </footer>

      {leaderIt && <LeaderModal l={leaderIt} list={leaders} origin={leaderOrigin.current} onClosed={() => setLeader(null)} onStep={stepLeader} />}
      {openIt && <DetailModal it={openIt} list={list} origin={origin.current} onClosed={() => setOpen(null)} onStep={step} />}
    </div>
  );
}
