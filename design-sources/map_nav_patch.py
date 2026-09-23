P = "/Users/josefigueroa/Desktop/adg-landing/src/ZoomMap.tsx"
s = open(P).read()


def rep(a, b):
    global s
    assert s.count(a) == 1, ("COUNT", s.count(a), a[:90])
    s = s.replace(a, b)


# ---- state: zoom level is animated over time by the map's own controls, not by page scroll ----
rep('''  const hintRef = useRef<HTMLParagraphElement>(null);''', '''  const zoom = useRef(0);            // 0 = statewide, 1 = South Florida (eased)
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
  };''')
rep('''      const r = t.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      const e = ease(clamp((p - 0.12) / 0.66));''', '''      const e = zoom.current;''')
rep('''      if (hintRef.current) hintRef.current.style.opacity = String(clamp(1 - p / 0.15));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [items]);''', '''    };
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
  }, [items]);''')
# cluster zooms in with the same animation
rep('''            onClick={() => { const t = track.current; if (t) window.scrollTo({ top: window.scrollY + t.getBoundingClientRect().top + (t.offsetHeight - window.innerHeight) * 0.85, behavior: "smooth" }); }}>''',
    '''            onClick={() => flyTo(1)}>''')
# controls replace the scroll hint
rep('''          <p ref={hintRef} className="fpz-hint">Scroll to explore South Florida</p>
        </div>''', '''        </div>
        <div className="fpz-controls" role="group" aria-label="Map view">
          <button aria-pressed={target === 0} className={target === 0 ? "on" : ""} onClick={() => flyTo(0)}>Florida</button>
          <button aria-pressed={target === 1} className={target === 1 ? "on" : ""} onClick={() => flyTo(1)}>South Florida</button>
        </div>''')
open(P, "w").write(s)

C = "/Users/josefigueroa/Desktop/adg-landing/src/site.css"
t = open(C).read()
t += '''
/* Map is a normal section now: scrolling passes straight through it */
.fpz-track { height: auto; }
.fpz-sticky { position: relative; top: auto; height: min(92vh, 860px); min-height: 560px; }
.fpz-controls { position: absolute; right: clamp(16px, 4vw, 48px); top: clamp(90px, 12vh, 140px); z-index: 6; display: flex; padding: 4px; gap: 4px; background: rgba(8, 20, 30, 0.72); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 999px; }
.fpz-controls button { font: inherit; font-size: 14px; font-weight: 600; color: rgba(255, 255, 255, 0.82); background: transparent; border: 0; border-radius: 999px; padding: 9px 18px; min-height: 40px; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
.fpz-controls button:hover { color: #fff; }
.fpz-controls button.on { background: #fff; color: var(--navy); }
@media (max-width: 760px) {
  .fpz-track { height: auto; }
  .fpz-sticky { height: 84vh; min-height: 540px; }
  .fpz-controls { top: auto; bottom: 44px; left: 50%; right: auto; transform: translateX(-50%); }
}
'''
open(C, "w").write(t)
print("patched")
