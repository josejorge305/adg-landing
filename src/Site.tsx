import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { projects, limitedPartnerPositions, stats, taglines, leaders, type Leader } from "./data";
import { ZoomMap } from "./ZoomMap";
import { hq } from "./hq";

const WEB3FORMS_KEY = "fea77824-b299-49c9-b114-52bb347f7fd6";
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IMG = "/assets/images/website/";

type Stat = { label: string; value: string };
type Item = {
  kind: "project" | "lp";
  name: string; location: string; address: string; coords: [number, number];
  units: string; type: string; status?: string; role?: string; description: string;
  stats: Stat[]; award: string | null; image: string; gallery: string[]; video?: string; poster?: string; sponsor?: string;
};
/* Portfolio collage order: long, short / short, long / full width */
const ORDER = ["Aura Living", "Alcazar Millenium", "Alcazar Apartment Villas", "Aura at Silver Lakes", "Spring Gardens", "SOMI Homes"];
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
function Hero({ onContact }: { onContact: () => void }) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "done">(() => {
    try { if (reducedMotion() || document.visibilityState !== "visible") return "done"; } catch { return "done"; }
    return "intro";
  });
  useEffect(() => {
    if (phase === "intro") { const t = window.setTimeout(() => setPhase("reveal"), 2300); return () => window.clearTimeout(t); }
    if (phase === "reveal") { const t = window.setTimeout(() => setPhase("done"), 1500); return () => window.clearTimeout(t); }
  }, [phase]);
  const t = taglines[0];
  const [night] = useState(() => { const h = new Date().getHours(); return h >= 19 || h < 6; });
  const base = night ? "/assets/site/hero-dusk" : "/assets/site/hero";
  const heroVideo = useRef<HTMLVideoElement>(null);
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
  }, [motionGo]);
  return (
    <section className={`hero hero-${phase}${night ? " hero-night" : " hero-day"}`} id="home">
      <picture>
        <source srcSet={`${base}.webp`} type="image/webp" />
        <img className="hero-img" src={`${base}.jpg`} alt="" aria-hidden="true" fetchPriority="high" />
      </picture>
      {motion && (
        <video ref={heroVideo} className="hero-video" src={night ? "/assets/site/hero-dusk-v3.mp4" : "/assets/site/hero-day-v3.mp4"} poster={`${base}.jpg`} muted playsInline preload="auto" aria-hidden="true" />
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
        <p className="eyebrow light">Workforce Housing Developer — South Florida</p>
        <h1>
          {t.top} <em>{t.accent}</em>
          <br />
          {t.bottom}
        </h1>
        <p className="hero-lede">
          Florida's teachers, nurses, and first responders deserve quality housing they can afford. ADG develops
          workforce communities that close the gap between income and rent — built to institutional standards,
          designed for real life.
        </p>
        <button className="text-link light" onClick={onContact}>Get In Touch</button>
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
function LoopVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion()) return;
    v.muted = true;
    let timer = 0, visible = false, resting = false;
    const play = () => { if (!visible) return; resting = false; v.classList.remove("settling"); v.currentTime = 0; v.play().catch(() => {}); };
    const onEnded = () => {
      resting = true;
      v.classList.add("settling");                                   // fade the video out over the still
      timer = window.setTimeout(() => { v.currentTime = 0; timer = window.setTimeout(play, REST_MS); }, SETTLE_MS);
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
  const excerpt = item.description || item.address;
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
        {item.video
          ? <LoopVideo src={item.video} poster={item.poster ?? item.image} label={`${item.name}, animated view`} />
          : <img src={item.image} alt={`${item.name}, ${item.location}`} loading="lazy" />}
      </div>
      <div className="pcard-body">
        <p className={`pill ${item.kind === "lp" ? "lp" : statusTone(item.status)}`}>{badge}</p>
        <h3>{item.name}</h3>
        <p className="pcard-loc">{item.location}</p>
        {excerpt && <p className="pcard-desc">{excerpt}</p>}
        <div className="pcard-facts"><span>{item.type}</span><strong>{item.units}</strong></div>
        <span className="pcard-more">View details</span>
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
    p.animate([{ backgroundColor: "rgba(255,255,255,0)", boxShadow: "none" }, { backgroundColor: "rgba(255,255,255,1)" }], { duration: 360, easing: "ease-out" });
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
      p.animate([{ backgroundColor: "rgba(255,255,255,1)" }, { backgroundColor: "rgba(255,255,255,0)", boxShadow: "none" }], { duration: 220, fill: "forwards" });
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
  const tomb = [it.type, it.units, it.location, it.kind === "lp" ? it.role! : sentence(it.status || "")];
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
            <p className="dm-sub">{it.address || it.location}</p>
            <ul className="dm-tomb">{tomb.filter(Boolean).map((x, k) => <li key={k}>{x}</li>)}</ul>
            {it.description && <p className="dm-desc">{it.description}</p>}
            {(it.stats.length > 0 || it.sponsor) && (
              <dl className="dm-facts">{[...(it.sponsor ? [{ label: "Sponsor", value: it.sponsor }] : []), ...it.stats].map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
            )}
            {it.award && <p className="dm-award">{it.award}</p>}
            <p className="dm-loc"><a href={maps} target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
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
        <strong>{l.name}</strong>
        <em>{l.title}</em>
        <span className="lead-more">View profile<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
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
    p.animate([{ backgroundColor: "rgba(255,255,255,0)", boxShadow: "none" }, { backgroundColor: "rgba(255,255,255,1)" }], { duration: 380, easing: "ease-out" });
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
      p.animate([{ backgroundColor: "rgba(255,255,255,1)" }, { backgroundColor: "rgba(255,255,255,0)", boxShadow: "none" }], { duration: 220, fill: "forwards" });
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
            <p className="lm-title">{l.title}, Alcazar Development Group</p>
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

  const links: [string, string][] = [["portfolio", "Portfolio"], ["about", "About"], ["team", "Team"], ["contact", "Contact"]];

  return (
    <div className="page">
      <div ref={progress} className="scroll-progress" aria-hidden="true" />
      <header className={`nav${nav.scrolled ? " is-scrolled" : ""}${nav.hidden && !menuOpen ? " is-hidden" : ""}`}>
        <div className="wrap nav-inner">
          <a href="#home" className="nav-logo" aria-label="Alcazar Development Group, home" onClick={(e) => { e.preventDefault(); go("home"); }}>
            <img src="/assets/site/adg-mark.png" alt="" aria-hidden="true" />
            <span className="nav-name">Alcazar Development Group</span>
          </a>
          <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main">
            {links.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); go(id); }}>{label}</a>)}
            <a className="nav-signin" href="https://adg-os.com">ADG-OS Sign In</a>
          </nav>
          <button className={menuOpen ? "nav-toggle is-open" : "nav-toggle"} aria-expanded={menuOpen} aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main>
        <Hero onContact={() => go("contact")} />

        <section id="portfolio" className="band tone">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Our Portfolio</p>
              <h2>Homes where <em>Florida's workforce</em> lives.</h2>
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
              <h2>Capital positions alongside institutional sponsors.</h2>
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
                hours to their schools. Nurses can't afford to live near their hospitals. ADG was founded to change
                that — developing high-quality, attainable housing that keeps the workforce close to where it's needed most.
              </p>
              <p>
                Every project is built to institutional standards — the same rigor demanded by tax credit investors and
                agency lenders — because the workforce deserves the same quality of construction, amenities, and management
                as any luxury community. With over 1,100 units developed or in our pipeline, we're proving that
                mission-driven development and strong returns aren't mutually exclusive.
              </p>
              <div className="award">
                <img src="/assets/site/sfbj-award-dark.png" alt="SFBJ Structures Awards" />
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
              <h2>Development, brokerage and private lending.</h2>
              <p className="section-sub">ADG operates alongside two affiliated firms under common leadership.</p>
            </div>
            <div className="aff stagger">
              {[
                { href: "https://www.fhcp-llc.com", logo: IMG + "fhcp-logo.png", name: "FHCP, LLC", desc: "Licensed private lender providing first-lien, asset-based loans on commercial and residential real estate in Florida." },
                { href: "https://reliantrealestategroup.com", logo: IMG + "reliant-logo.png", name: "Reliant Real Estate Group, LLC", desc: "Commercial real estate brokerage in Florida, covering acquisitions and dispositions, loan and note sales, and bank-owned property." },
              ].map((a) => (
                <a key={a.name} className="aff-card" href={a.href} target="_blank" rel="noopener noreferrer">
                  <div className="aff-logo"><img src={a.logo} alt={a.name} /></div>
                  <div><strong>{a.name}</strong><p>{a.desc}</p><span>Visit website</span></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="band navy contact">
          <div className="wrap contact-grid">
            <div className="reveal">
              <p className="eyebrow light">Get in Touch</p>
              <h2>Let's house <em>Florida's workforce.</em></h2>
              <dl className="contact-list">
                <div><dt>Office</dt><dd>7520 SW 57th Avenue Suite G{"\n"}South Miami, FL 33143</dd></div>
                <div><dt>Phone</dt><dd><a href="tel:3057726191">(305) 772-6191</a></dd></div>
              </dl>
            </div>
            <form className="cform reveal" onSubmit={submit}>
              {(["name", "email", "subject"] as const).map((f) => (
                <label key={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <input type={f === "email" ? "email" : "text"} name={f} required={f !== "subject"} placeholder={`Your ${f}`} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                </label>
              ))}
              <label>
                Message
                <textarea name="message" required rows={4} placeholder="Your message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
              <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" checked={trap} onChange={(e) => setTrap(e.target.checked)} style={{ display: "none" }} aria-hidden="true" />
              <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending..." : "Send Message"}</button>
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
            <p>Workforce Housing Developer — South Florida</p>
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
        </div>
      </footer>

      {leaderIt && <LeaderModal l={leaderIt} list={leaders} origin={leaderOrigin.current} onClosed={() => setLeader(null)} onStep={stepLeader} />}
      {openIt && <DetailModal it={openIt} list={list} origin={origin.current} onClosed={() => setOpen(null)} onStep={step} />}
    </div>
  );
}
