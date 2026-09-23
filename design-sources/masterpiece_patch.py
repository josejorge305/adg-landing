P = "/Users/josefigueroa/Desktop/adg-landing/src/Site.tsx"
s = open(P).read()


def rep(a, b):
    global s
    assert s.count(a) == 1, ("COUNT", s.count(a), a[:90])
    s = s.replace(a, b)


# ---- upgraded images everywhere ----
rep('import { Footprint } from "./Footprint";', 'import { Footprint } from "./Footprint";\nimport { hq } from "./hq";')
rep('''  .map((p) => ({ ...p, kind: "project" as const, gallery: p.gallery as string[], video: (p as { video?: string }).video }))''',
    '''  .map((p) => ({ ...p, kind: "project" as const, image: hq(p.image), gallery: (p.gallery as string[]).map(hq), video: (p as { video?: string }).video }))''')
rep('''const LPS: Item[] = limitedPartnerPositions.map((p) => ({ ...p, kind: "lp" as const, gallery: p.gallery as string[] }));''',
    '''const LPS: Item[] = limitedPartnerPositions.map((p) => ({ ...p, kind: "lp" as const, image: hq(p.image), gallery: (p.gallery as string[]).map(hq) }));''')
rep('''<img src={IMG + "closing-the-gap.jpg"} alt="ADG Groundbreaking Ceremony" loading="lazy" />''',
    '''<img src={hq(IMG + "closing-the-gap.jpg")} alt="ADG Groundbreaking Ceremony" loading="lazy" />''')

# ---- time-of-day hero: daylight render by day, the lit dusk render after 7 pm ----
rep('''  const t = taglines[0];
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
      </div>''', '''  const t = taglines[0];
  const [night] = useState(() => { const h = new Date().getHours(); return h >= 19 || h < 6; });
  const base = night ? "/assets/site/hero-dusk" : "/assets/site/hero";
  return (
    <section className={`hero hero-${phase}${night ? " hero-night" : " hero-day"}`} id="home">
      <picture>
        <source srcSet={`${base}.webp`} type="image/webp" />
        <img className="hero-img" src={`${base}.jpg`} alt="" aria-hidden="true" fetchPriority="high" />
      </picture>
      <div className="hero-lines" aria-hidden="true">
        <picture>
          <source srcSet={`${base}-lines.webp`} type="image/webp" />
          <img src={`${base}-lines.png`} alt="" />
        </picture>
      </div>
      <div className="hero-sweep" aria-hidden="true" />''')

# ---- cards: first line of the existing description (or the address) fills the gap; cursor light ----
rep('''function Card({ item, layout, index = 0, onOpen }: { item: Item; layout?: "wide" | "full"; index?: number; onOpen: (el: Element | null) => void }) {
  const badge = item.kind === "lp" ? item.role! : sentence(item.status || "");''', '''function firstSentence(t: string) {
  const m = t.match(/^.*?[.!?](\\s|$)/);
  return (m ? m[0] : t).trim();
}
function Card({ item, layout, index = 0, onOpen }: { item: Item; layout?: "wide" | "full"; index?: number; onOpen: (el: Element | null) => void }) {
  const badge = item.kind === "lp" ? item.role! : sentence(item.status || "");
  const excerpt = item.description ? firstSentence(item.description) : item.address;''')
rep('''      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(e.currentTarget.querySelector(".pcard-img")); } }}
    >''', '''      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(e.currentTarget.querySelector(".pcard-img")); } }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >''')
rep('''        <p className="pcard-loc">{item.location}</p>''', '''        <p className="pcard-loc">{item.location}</p>
        {excerpt && <p className="pcard-desc">{excerpt}</p>}''')

# ---- leadership: bios clamp to four lines with a toggle ----
rep('''/* ---------------- Page ---------------- */''', '''/* ---------------- Leadership card ---------------- */
function Member({ m }: { m: { name: string; title: string; bio: string; image: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="member">
      <div className="member-photo"><img src={m.image.replace("/assets/images/website/", "/assets/site/").replace(".jpg", "-light.jpg")} alt={m.name} loading="lazy" /></div>
      <div className="member-body">
        <h3>{m.name}</h3>
        <p className="member-title">{m.title}</p>
        <p className={`member-bio${open ? " open" : ""}`}>{m.bio}</p>
        <button className="member-more" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Show less" : "Read full bio"}</button>
      </div>
    </article>
  );
}

/* ---------------- Page ---------------- */''')
i = s.index('              {teamMembers.map((m) => (')
j = s.index('              ))}', i) + len('              ))}')
s = s[:i] + '              {teamMembers.map((m) => <Member key={m.name} m={m} />)}' + s[j:]

# ---- nav: the ADG mark with the company name set as crisp text ----
rep('''            <img src="/assets/site/adg-logo-color.png" alt="Alcazar Development Group" />''',
    '''            <img src="/assets/site/adg-mark.png" alt="" aria-hidden="true" />
            <span className="nav-name">Alcazar Development Group</span>''')

# ---- institutional footer, from existing content ----
i = s.index('      <footer className="site-footer">')
j = s.index('      </footer>', i) + len('      </footer>')
s = s[:i] + '''      <footer className="site-footer">
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
      </footer>''' + s[j:]

open(P, "w").write(s)

C = "/Users/josefigueroa/Desktop/adg-landing/src/site.css"
t = open(C).read()
t += r'''

/* ===================== Masterpiece pass ===================== */
/* Palette: three blues (logo steel blue, a deep text blue, one light tint) plus a single brass accent */
:root { --blue: #4088b4; --blue-deep: #2f6f98; --blue-light: #8cc3e4; --brass: #b08a4f; }
.hero h1 em, .band.navy h2 em { color: var(--blue-light); }
.fp-dot.project, .fp-key.project, .fp-badge.project, .fp-mini.project, .fp-pin.project .fp-dot { fill: var(--blue-light); background: var(--blue-light); }
.cform button:hover { background: var(--blue-deep); }
.stat-plus { color: var(--brass); }
.dm-award { border-left-color: var(--brass); }
.award { border-top-color: var(--rule); }

/* Nav: the mark plus the company name as crisp text */
.nav-logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.nav-logo img { height: 34px; }
.nav-name { font-family: var(--serif); font-size: 21px; font-weight: 600; color: var(--ink); letter-spacing: 0.005em; white-space: nowrap; }
@media (max-width: 760px) { .nav-logo img { height: 28px; } .nav-name { font-size: 17px; } }

/* Hero: a stronger, softer shade behind the headline */
.hero-shade { background: linear-gradient(180deg, rgba(8, 18, 27, 0) 30%, rgba(8, 18, 27, 0.55) 72%, rgba(8, 18, 27, 0.78) 100%), linear-gradient(90deg, rgba(8, 18, 27, 0.62) 0%, rgba(8, 18, 27, 0.25) 45%, rgba(8, 18, 27, 0) 70%); }
.hero-night .hero-shade { background: linear-gradient(180deg, rgba(8, 12, 20, 0) 30%, rgba(8, 12, 20, 0.55) 72%, rgba(8, 12, 20, 0.8) 100%), linear-gradient(90deg, rgba(8, 12, 20, 0.6) 0%, rgba(8, 12, 20, 0.2) 45%, rgba(8, 12, 20, 0) 70%); }
.hero-night .hero-lines img { filter: drop-shadow(0 0 3px rgba(240, 200, 150, 0.5)); }
/* Sunlight: a soft band of light glides across the facade every ~15 seconds (daytime only) */
.hero-sweep { position: absolute; inset: 0; z-index: 2; pointer-events: none; overflow: hidden; opacity: 0; }
.hero-day.hero-done .hero-sweep { opacity: 1; }
.hero-sweep::before { content: ""; position: absolute; top: -20%; bottom: -20%; left: -40%; width: 38%; background: linear-gradient(100deg, rgba(255, 244, 220, 0) 0%, rgba(255, 244, 220, 0.16) 50%, rgba(255, 244, 220, 0) 100%); mix-blend-mode: soft-light; transform: translateX(0) skewX(-12deg); animation: sunSweep 15s ease-in-out 1.5s infinite; }
@keyframes sunSweep { 0% { transform: translateX(0) skewX(-12deg); } 45%, 100% { transform: translateX(420%) skewX(-12deg); } }

/* Navy bands: a very slow drifting glow so the dark sections feel lit */
.band.navy { position: relative; overflow: hidden; }
.band.navy::before { content: ""; position: absolute; width: 70vw; height: 70vw; max-width: 1100px; max-height: 1100px; left: 50%; top: 40%; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(64, 136, 180, 0.16) 0%, rgba(64, 136, 180, 0) 60%); pointer-events: none; animation: ambient 60s ease-in-out infinite alternate; }
.band.navy > .wrap { position: relative; z-index: 1; }
@keyframes ambient { from { transform: translate(-75%, -60%); } to { transform: translate(-25%, -40%); } }

/* Cards: the first line of each project's description; a faint light follows the cursor */
.pcard-desc { font-size: 15px; line-height: 1.6; color: var(--body); margin: -8px 0 18px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pcard { position: relative; }
.pcard::before { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0; transition: opacity 0.3s ease; background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 60%); }
@media (hover: hover) { .pcard:hover::before { opacity: 1; } }

/* Leadership: bios clamp to four lines, expandable */
.member-bio { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.member-bio.open { display: block; }
.member-more { margin-top: 12px; padding: 0; font: inherit; font-size: 14px; font-weight: 600; color: var(--blue-deep); background: none; border: 0; cursor: pointer; min-height: 32px; }
.member-more:hover { text-decoration: underline; text-underline-offset: 3px; }

/* Institutional footer */
.site-footer { background: #070f16; color: rgba(255, 255, 255, 0.72); font-size: 15px; }
.footer-grid { display: grid; grid-template-columns: 1.4fr 1.2fr 1fr 1fr; gap: 40px; padding: 64px 0 44px; }
.footer-brand img { height: 44px; width: auto; margin-bottom: 16px; }
.footer-brand p { font-size: 14px; color: rgba(255, 255, 255, 0.6); max-width: 18em; }
.footer-h { font-size: 13px; font-weight: 600; color: var(--blue-light); margin-bottom: 12px; letter-spacing: 0.02em; }
.footer-grid p + p { margin-top: 8px; }
.footer-grid a { display: block; color: rgba(255, 255, 255, 0.82); text-decoration: none; padding: 3px 0; }
.footer-grid a:hover { color: #fff; }
.footer-base { border-top: 1px solid rgba(255, 255, 255, 0.1); padding: 22px 0 28px; font-size: 13.5px; color: rgba(255, 255, 255, 0.55); }
@media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; padding-top: 48px; } .footer-brand { grid-column: 1 / -1; } }

@media (prefers-reduced-motion: reduce) {
  .hero-sweep, .band.navy::before { display: none; }
}
'''
open(C, "w").write(t)
print("patched")
