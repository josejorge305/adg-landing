import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { projects, limitedPartnerPositions, teamMembers, stats, taglines } from "./data";
import { FL_PATH, FL_VIEWBOX, project as proj } from "./florida";

const WEB3FORMS_KEY = "fea77824-b299-49c9-b114-52bb347f7fd6";
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const IMG = "/assets/images/website/";

type Stat = { label: string; value: string };
type Item = {
  kind: "project" | "lp";
  name: string; location: string; address: string; coords: [number, number];
  units: string; type: string; status?: string; role?: string; description: string;
  stats: Stat[]; award: string | null; image: string; gallery: string[]; video?: string;
};
/* Portfolio collage order: long, short / short, long / full width */
const ORDER = ["Aura Living", "Alcazar Millenium", "Alcazar Apartment Villas", "Aura at Silver Lakes", "Spring Gardens"];
const LAYOUT: Record<string, "wide" | "full" | undefined> = { "Aura Living": "wide", "Aura at Silver Lakes": "wide", "Spring Gardens": "full" };
const PROJECTS: Item[] = projects
  .map((p) => ({ ...p, kind: "project" as const, gallery: p.gallery as string[], video: (p as { video?: string }).video }))
  .sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
const LPS: Item[] = limitedPartnerPositions.map((p) => ({ ...p, kind: "lp" as const, gallery: p.gallery as string[] }));
const ALL: Item[] = [...PROJECTS, ...LPS];

/* "BREAKING GROUND Q1 2027" -> "Breaking ground Q1 2027" (display only; the data is unchanged) */
function sentence(s: string) {
  return s.split(" ").map((w, i) => (/^Q\d$/.test(w) ? w : i === 0 ? w.charAt(0) + w.slice(1).toLowerCase() : w.toLowerCase())).join(" ");
}
function statusTone(s = "") {
  if (/SOLD/.test(s)) return "sold";
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
  return (
    <section className={`hero hero-${phase}`} id="home">
      <picture>
        <source srcSet="/assets/site/hero.webp" type="image/webp" />
        <img className="hero-img" src="/assets/site/hero.jpg" alt="" aria-hidden="true" fetchPriority="high" />
      </picture>
      <div className="hero-lines" aria-hidden="true">
        <picture>
          <source srcSet="/assets/site/hero-lines.webp" type="image/webp" />
          <img src="/assets/site/hero-lines.png" alt="" />
        </picture>
      </div>
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

/* Silent looping clip; reduced-motion visitors see the still frame */
function LoopVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion()) return;
    v.muted = true;
    v.play().catch(() => {});
  }, [src]);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={label} />;
}

/* ---------------- Portfolio card ---------------- */
function Card({ item, layout, onOpen }: { item: Item; layout?: "wide" | "full"; onOpen: (el: Element | null) => void }) {
  const badge = item.kind === "lp" ? item.role! : sentence(item.status || "");
  return (
    <article
      className={`pcard${layout ? " " + layout : ""}`}
      data-name={item.name}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}: view details`}
      onClick={(e) => onOpen(e.currentTarget.querySelector(".pcard-img"))}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(e.currentTarget.querySelector(".pcard-img")); } }}
    >
      <div className="pcard-img">
        {item.video
          ? <LoopVideo src={item.video} poster={item.image} label={`${item.name}, aerial animation`} />
          : <img src={item.image} alt={`${item.name}, ${item.location}`} loading="lazy" />}
      </div>
      <div className="pcard-body">
        <p className={`pill ${item.kind === "lp" ? "lp" : statusTone(item.status)}`}>{badge}</p>
        <h3>{item.name}</h3>
        <p className="pcard-loc">{item.location}</p>
        <div className="pcard-facts"><span>{item.type}</span><strong>{item.units}</strong></div>
        <span className="pcard-more">View details</span>
      </div>
    </article>
  );
}

/* ---------------- Footprint map (vector, navy) ---------------- */
const MIAMI = { latMin: 25.4, latMax: 26.1, lonMin: -80.72, lonMax: -80.08 };
const inMiami = (c: [number, number]) => c[0] > MIAMI.latMin && c[0] < MIAMI.latMax && c[1] > MIAMI.lonMin && c[1] < MIAMI.lonMax;

function FootprintMap({ onSelect }: { onSelect: (name: string) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ it: Item; x: number; y: number } | null>(null);
  const show = (it: Item, el: Element) => {
    const w = wrap.current?.getBoundingClientRect(), r = el.getBoundingClientRect();
    if (w) setTip({ it, x: r.left + r.width / 2 - w.left, y: r.top - w.top });
  };
  const spread = (list: Item[], gap: number) => {
    const pts = list.map((c) => proj(c.coords[0], c.coords[1]));
    for (let pass = 0; pass < 8; pass++)
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          let dx = pts[j][0] - pts[i][0], dy = pts[j][1] - pts[i][1];
          let d = Math.hypot(dx, dy);
          if (d >= gap) continue;
          if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
          const push = (gap - d) / 2;
          pts[i] = [pts[i][0] - (dx / d) * push, pts[i][1] - (dy / d) * push];
          pts[j] = [pts[j][0] + (dx / d) * push, pts[j][1] + (dy / d) * push];
        }
    return new Map(list.map((c, k) => [c.name, pts[k]]));
  };
  const pins = (list: Item[], r: number, interactive: boolean) => {
    const placed = spread(list, r * 2.6);
    return list.map((it) => {
      const [x, y] = placed.get(it.name)!;
      const dot = <circle cx={x} cy={y} r={r} className={`fp-dot ${it.kind}`} vectorEffect="non-scaling-stroke" />;
      if (!interactive) return <g key={it.name} className="fp-pin static" aria-hidden="true">{dot}</g>;
      return (
        <g key={it.name} className="fp-pin" tabIndex={0} role="button" aria-label={`${it.name}, ${it.location}`}
          onMouseEnter={(e) => show(it, e.currentTarget)} onMouseLeave={() => setTip(null)}
          onFocus={(e) => show(it, e.currentTarget)} onBlur={() => setTip(null)}
          onClick={() => { setTip(null); onSelect(it.name); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(it.name); } }}>
          <circle cx={x} cy={y} r={r * 1.4} fill="transparent" />
          {dot}
        </g>
      );
    });
  };
  const miami = ALL.filter((c) => inMiami(c.coords));
  const others = ALL.filter((c) => !inMiami(c.coords));
  const [bx1, by1] = proj(MIAMI.latMax, MIAMI.lonMin);
  const [bx2, by2] = proj(MIAMI.latMin, MIAMI.lonMax);
  return (
    <div className="fp" ref={wrap}>
      <figure className="fp-main">
        <svg viewBox={FL_VIEWBOX} preserveAspectRatio="xMinYMid meet" role="img" aria-label="Map of ADG projects and investments across Florida">
          <path d={FL_PATH} className="fp-land" vectorEffect="non-scaling-stroke" />
          <rect x={bx1} y={by1} width={bx2 - bx1} height={by2 - by1} className="fp-mark" vectorEffect="non-scaling-stroke" />
          {pins(others, 10, true)}
          {pins(miami, 6, false)}
        </svg>
      </figure>
      <figure className="fp-inset">
        <svg viewBox={`${bx1} ${by1} ${bx2 - bx1} ${by2 - by1}`} role="img" aria-label="Detail of South Florida">
          <path d={FL_PATH} className="fp-land" vectorEffect="non-scaling-stroke" />
          {pins(miami, 1.5, true)}
        </svg>
        <figcaption>South Florida detail</figcaption>
      </figure>
      {tip && (
        <div className="fp-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <strong>{tip.it.name}</strong>
          <span>{tip.it.location}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Detail view ---------------- */
function DetailModal({ it, list, origin, onClosed, onStep }: {
  it: Item; list: Item[]; origin: DOMRect | null; onClosed: () => void; onStep: (dir: 1 | -1) => void;
}) {
  const gallery = [...(it.video ? [it.video] : []), ...(it.gallery.length ? it.gallery : it.video ? [] : [it.image])];
  const [gi, setGi] = useState(0);
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
    const el = document.querySelector(`.pcard[data-name="${CSS.escape(name.current)}"] .pcard-img`);
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
          {gallery[gi].endsWith(".mp4")
            ? <LoopVideo key={gallery[gi]} src={gallery[gi]} poster={it.image} label={`${it.name}, aerial animation`} />
            : <img key={gallery[gi]} src={gallery[gi]} alt={`${it.name}, image ${gi + 1} of ${gallery.length}`} />}
          {gallery.length > 1 && (
            <div className="dm-gal">
              <button onClick={() => setGi((gi - 1 + gallery.length) % gallery.length)} aria-label="Previous image">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <span>{gi + 1} / {gallery.length}</span>
              <button onClick={() => setGi((gi + 1) % gallery.length)} aria-label="Next image">
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
            {it.stats.length > 0 && (
              <dl className="dm-facts">{it.stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}</dl>
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

/* ---------------- Page ---------------- */
export function Site() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [nav, setNav] = useState({ scrolled: false, hidden: false });
  const [open, setOpen] = useState<string | null>(null);
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
            <img src="/assets/site/adg-logo-color.png" alt="Alcazar Development Group" />
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
              {PROJECTS.map((p) => <Card key={p.name} item={p} layout={LAYOUT[p.name]} onOpen={(el) => openItem(p.name, el)} />)}
            </div>
          </div>
        </section>

        <section id="investments" className="band">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Investment Portfolio</p>
              <h2>Capital positions alongside institutional sponsors.</h2>
            </div>
            <div className="pgrid lp stagger">
              {LPS.map((p) => <Card key={p.name} item={p} onOpen={(el) => openItem(p.name, el)} />)}
            </div>
          </div>
        </section>

        <section id="footprint" className="band navy">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow light">Our Footprint</p>
              <h2>Across <em>Florida.</em></h2>
              <ul className="fp-legend">
                <li><span className="fp-key project" />Developments</li>
                <li><span className="fp-key lp" />Investments</li>
              </ul>
            </div>
            <FootprintMap onSelect={(n) => openItem(n, null)} />
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
              <img src={IMG + "closing-the-gap.jpg"} alt="ADG Groundbreaking Ceremony" loading="lazy" />
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

        <section id="team" className="band tone">
          <div className="wrap">
            <div className="section-head reveal">
              <p className="eyebrow">Leadership</p>
              <h2>The people behind <em>the mission.</em></h2>
            </div>
            <div className="team stagger">
              {teamMembers.map((m) => (
                <article key={m.name} className="member">
                  <div className="member-photo"><img src={m.image.replace("/assets/images/website/", "/assets/site/").replace(".jpg", "-light.jpg")} alt={m.name} loading="lazy" /></div>
                  <div className="member-body">
                    <h3>{m.name}</h3>
                    <p className="member-title">{m.title}</p>
                    <p className="member-bio">{m.bio}</p>
                  </div>
                </article>
              ))}
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
                { href: "https://reliantrealestategroup.com", logo: IMG + "reliant-logo.png", name: "Reliant Real Estate Group", desc: "Commercial real estate brokerage in Florida, covering acquisitions and dispositions, loan and note sales, and bank-owned property." },
                { href: "https://www.fhcp-llc.com", logo: IMG + "fhcp-logo.png", name: "Figueroa-Heller Capital Partners", desc: "Licensed private lender providing first-lien, asset-based loans on commercial and residential real estate in Florida." },
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
              {status === "sent" && <p className="cform-status" role="status">Message sent. We will be in touch shortly.</p>}
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
        <div className="wrap footer">
          <img src={IMG + "adg-logo.png"} alt="" aria-hidden="true" />
          <p>© {new Date().getFullYear()} Alcazar Development Group, LLC</p>
          <a href="https://adg-os.com">ADG-OS Platform →</a>
        </div>
      </footer>

      {openIt && <DetailModal it={openIt} list={list} origin={origin.current} onClosed={() => setOpen(null)} onStep={step} />}
    </div>
  );
}
