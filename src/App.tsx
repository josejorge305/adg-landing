import { useState, useEffect, useRef, useCallback } from "react";

const ADG_CYAN = "#00B4D8";
const ADG_DARK = "#0A0A0A";

const projects = [
  {
    name: "Alcazar Apartment Villas",
    location: "Naranja, Florida",
    units: "288 Units",
    type: "Market Rate Apartments",
    status: "SOLD Q4 2021",
    statusColor: "#FF6B35",
    description:
      "Award-winning 288-unit market rent apartment community comprised of twelve buildings with 1, 2 and 3 bedroom units and a resort-style clubhouse.",
    award: "SFBJ Structures Awards — Best Affordable Residential",
    image: "/assets/images/website/alcazar-apartment-villas.jpg",
  },
  {
    name: "Aura Living",
    location: "Naranja, Florida",
    units: "220 Units",
    type: "Affordable Housing",
    status: "BREAKING GROUND Q3 2026",
    statusColor: "#00E676",
    description:
      "A 220-unit, seven-story mid-rise affordable housing development serving households at or below 60% AMI. The community offers a diversified unit mix of one, two, and three-bedroom residences addressing critical workforce housing demand in this submarket.",
    award: null,
    image: "/assets/images/website/aura-living.jpg",
  },
  {
    name: "Aura at Silver Lakes",
    location: "Leesburg, Florida",
    units: "256 Units",
    type: "Affordable Housing",
    status: "BREAKING GROUND Q3 2026",
    statusColor: "#00E676",
    description:
      "A 256-unit affordable housing community featuring garden-style apartments with two, three, and four-bedroom residences serving households at or below 60% AMI, addressing critical workforce housing demand in the Lake County MSA.",
    award: null,
    image: "/assets/images/website/aura-at-silver-lakes.jpg",
  },
  {
    name: "Alcazar Millenium",
    location: "Naranja, Florida",
    units: "192 Units",
    type: "Mixed Use",
    status: "IN DEVELOPMENT",
    statusColor: "#FFD60A",
    description:
      "A mixed-use development site accommodating 192 market rent apartments and 5,000 square feet of commercial space at SW 150th Avenue and 280th Street.",
    award: null,
    image: "/assets/images/website/alcazar-millenium.jpg",
  },
  {
    name: "Spring Gardens",
    location: "Miami Health District",
    units: "240 Units",
    type: "Multifamily Development",
    status: "CURRENTLY LEASING",
    statusColor: "#00E676",
    description:
      "A 240-unit multifamily development located in the Downtown Miami Health District. A joint venture with Estates Investment Group.",
    award: null,
    image: "/assets/images/website/spring-gardens.jpg",
  },
  {
    name: "Kendallwood",
    location: "Miami, Florida",
    units: "36,500 SF",
    type: "Class A Office",
    status: "100% LEASED",
    statusColor: "#00B4D8",
    description:
      "A 36,500 square foot office building built in 2007. Interior space completely renovated as a Class A building in 2016 and 100% leased to a government agency.",
    award: null,
    image: "/assets/images/website/kendallwood.jpg",
  },
];

const teamMembers = [
  {
    name: "JJ Figueroa",
    title: "Managing Director",
    bio: "Real estate developer, broker, and financier with over two decades of experience. He is also co-founder of Figueroa-Heller Capital Partners, a private mortgage lending platform. Earlier in his career, he worked with Caribe Homes Corporation, contributing to the development and sales of 17 single-family communities across South Florida totaling more than 2,200 homes.",
    image: "/assets/images/website/jj-figueroa.jpg",
  },
  {
    name: "Justo L. Fernandez",
    title: "Managing Director",
    bio: "Real estate development executive with more than four decades of industry experience. Prior to entering development, he spent 30 years in the financial industry at Mercantil Commercebank, serving as Executive Vice President and leading the Commercial Real Estate Division while managing a loan portfolio exceeding $1.6 billion.",
    image: "/assets/images/website/justo-fernandez.jpg",
  },
  {
    name: "Guillermo Villar",
    title: "Principal",
    bio: "Bringing more than four decades of financial and real estate expertise. He built a distinguished international banking career with Chase and Mercantil, ultimately serving as President and CEO of Commercebank in Miami. His background includes leadership roles in corporate lending, financial management, and global banking operations.",
    image: "/assets/images/website/guillermo-villar.jpg",
  },
];

const stats = [
  { number: "1,100+", label: "Units Developed" },
  { number: "3", label: "Active Projects" },
  { number: "10+", label: "Years of Excellence" },
  { number: "$240M+", label: "Development Pipeline" },
];

const taglines = [
  { top: "Housing the", accent: "Workforce.", bottom: "Strengthening Communities." },
  { top: "Where Florida's", accent: "Workforce", bottom: "Comes Home." },
  { top: "Developing", accent: "What", bottom: "Matters." },
  { top: "Attainable", accent: "Living.", bottom: "Institutional Quality." },
];

const noiseURL = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E`;

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return { isMobile: width < 768, isTablet: width >= 768 && width < 1024, isDesktop: width >= 1024, width };
}

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

function AnimatedCounter({ target }: { target: string }) {
  const [count, setCount] = useState("0");
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const hasAnimated = useRef(false);
  const duration = 2000;

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const numericPart = target.replace(/[^0-9.]/g, "");
    const prefix = target.match(/^\D*/)?.[0] || "";
    const suffixPart = target.match(/\D*$/)?.[0] || "";
    const num = parseFloat(numericPart);
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(num * eased);
      setCount(prefix + current.toLocaleString() + suffixPart);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [inView, target]);

  return <span ref={ref}>{count}</span>;
}

export function ADGWebsite() {
  const [scrollY, setScrollY] = useState(0);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [heroTextVisible, setHeroTextVisible] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineFading, setTaglineFading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isMobile, isTablet } = useBreakpoint();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const aboutInView = useInView(aboutRef);
  const teamRef = useRef<HTMLElement>(null);
  const teamInView = useInView(teamRef);
  const contactRef = useRef<HTMLElement>(null);
  const contactInView = useInView(contactRef);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    setTimeout(() => setHeroTextVisible(true), 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineFading(true);
      setTimeout(() => {
        setTaglineIndex((prev) => (prev + 1) % 4);
        setTaglineFading(false);
      }, 600);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavSolid(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = "grab";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleSignIn = () => {
    window.location.href = "https://adg-os.com";
  };

  const compact = isMobile || isTablet;

  return (
    <div
      style={{
        fontFamily: "'Outfit', sans-serif",
        background: ADG_DARK,
        color: "#fff",
        minHeight: "100vh",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.2); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        * { box-sizing: border-box; }
        *::-webkit-scrollbar { height: 4px; width: 4px; }
        *::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        *::-webkit-scrollbar-thumb { background: ${ADG_CYAN}44; border-radius: 2px; }
        html { scroll-behavior: smooth; }
        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }
      `}</style>

      {/* Global grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundImage: `url("${noiseURL}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px",
          pointerEvents: "none",
          opacity: 0.35,
        }}
      />

      {/* ===== MOBILE MENU OVERLAY ===== */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(10,10,10,0.98)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 28,
              cursor: "pointer",
              padding: 8,
              lineHeight: 1,
            }}
          >
            &#x2715;
          </button>
          {["Home", "Portfolio", "About", "Team", "Contact"].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase" as const,
                fontFamily: "'Outfit', sans-serif",
                opacity: 0.8,
              }}
            >
              {item}
            </button>
          ))}
          <button
            onClick={() => { setMobileMenuOpen(false); handleSignIn(); }}
            style={{
              background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6)`,
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase" as const,
              fontFamily: "'Space Mono', monospace",
              padding: "14px 48px",
              borderRadius: 4,
              marginTop: 16,
            }}
          >
            ADG-OS Sign In
          </button>
        </div>
      )}

      {/* ===== NAVIGATION ===== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: isMobile ? "0 20px" : "0 40px",
          height: isMobile ? 60 : 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: navSolid ? "rgba(10,10,10,0.95)" : "transparent",
          backdropFilter: navSolid ? "blur(20px)" : "none",
          borderBottom: navSolid ? "1px solid rgba(0,180,216,0.15)" : "1px solid transparent",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16, cursor: "pointer" }}
          onClick={() => scrollToSection("home")}
        >
          <img
            src="/assets/images/website/adg-logo.png"
            alt="ADG"
            style={{
              height: isMobile ? 36 : 56,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <div
              style={{
                fontSize: isMobile ? 14 : 22,
                fontWeight: 700,
                letterSpacing: isMobile ? 2 : 3,
                lineHeight: 1,
                color: "#FFFFFF",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              ALCAZAR
            </div>
            <div
              style={{
                fontSize: isMobile ? 8 : 11,
                fontWeight: 400,
                letterSpacing: isMobile ? 3 : 5,
                opacity: 0.7,
                lineHeight: 1.4,
                color: "#FFFFFF",
                fontFamily: "'Outfit', sans-serif",
                marginTop: isMobile ? 1 : 2,
              }}
            >
              DEVELOPMENT GROUP
            </div>
          </div>
        </div>

        {isMobile ? (
          /* Mobile: hamburger + sign in */
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSignIn}
              style={{
                background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6)`,
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase" as const,
                fontFamily: "'Space Mono', monospace",
                padding: "8px 14px",
                borderRadius: 4,
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                flexDirection: "column",
                gap: 5,
              }}
            >
              <span style={{ width: 22, height: 2, background: "#fff", display: "block", borderRadius: 1 }} />
              <span style={{ width: 22, height: 2, background: "#fff", display: "block", borderRadius: 1 }} />
              <span style={{ width: 22, height: 2, background: "#fff", display: "block", borderRadius: 1 }} />
            </button>
          </div>
        ) : (
          /* Desktop: full nav */
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Home", "Portfolio", "About", "Team", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: 2,
                  textTransform: "uppercase" as const,
                  fontFamily: "'Space Mono', monospace",
                  opacity: 0.7,
                  transition: "all 0.3s",
                  padding: "4px 0",
                  borderBottom: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.opacity = "1";
                  (e.target as HTMLElement).style.borderBottomColor = ADG_CYAN;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.opacity = "0.7";
                  (e.target as HTMLElement).style.borderBottomColor = "transparent";
                }}
              >
                {item}
              </button>
            ))}
            <button
              onClick={handleSignIn}
              style={{
                background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6)`,
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase" as const,
                fontFamily: "'Space Mono', monospace",
                padding: "10px 24px",
                borderRadius: 4,
                transition: "all 0.3s",
                boxShadow: "0 0 20px rgba(0,180,216,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(-2px)";
                (e.target as HTMLElement).style.boxShadow = "0 4px 30px rgba(0,180,216,0.5)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(0)";
                (e.target as HTMLElement).style.boxShadow = "0 0 20px rgba(0,180,216,0.3)";
              }}
            >
              ADG-OS Sign In
            </button>
          </div>
        )}
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section
        id="home"
        style={{
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Hero background image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/assets/images/website/hero-image.png)",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
            transform: isMobile ? undefined : `scale(${1 + scrollY * 0.0003})`,
            transition: isMobile ? undefined : "transform 0.1s linear",
          }}
        />
        {/* Fallback gradient if hero image doesn't load */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, #03045E, #023E8A, #0077B6, ${ADG_CYAN})`,
            zIndex: -1,
          }}
        />
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,10,10,0.65) 0%, rgba(10,10,10,0.5) 40%, rgba(10,10,10,0.7) 70%, rgba(10,10,10,0.92) 100%)",
          }}
        />
        {/* Cyan accent glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(0,180,216,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: "inset 0 0 150px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            maxWidth: 900,
            padding: isMobile ? "0 20px" : "0 40px",
          }}
        >
          {/* Pre-header */}
          <div style={{ overflow: "hidden", marginBottom: isMobile ? 16 : 24 }}>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: isMobile ? 10 : 13,
                fontWeight: 400,
                letterSpacing: isMobile ? 4 : 8,
                textTransform: "uppercase" as const,
                color: ADG_CYAN,
                transform: heroTextVisible ? "translateY(0)" : "translateY(100%)",
                opacity: heroTextVisible ? 1 : 0,
                transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
              }}
            >
              Workforce Housing Developer — South Florida
            </div>
          </div>

          {/* Tagline top */}
          <div style={{ overflow: "hidden", marginBottom: isMobile ? 0 : 8, paddingBottom: 8 }}>
            <h1
              style={{
                fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: isMobile ? -1 : -3,
                transform: heroTextVisible ? "translateY(0)" : "translateY(100%)",
                opacity: heroTextVisible && !taglineFading ? 1 : heroTextVisible ? 0 : 0,
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {taglines[taglineIndex].top}
            </h1>
          </div>

          {/* Tagline accent */}
          <div style={{ overflow: "hidden", marginBottom: isMobile ? 0 : 8, paddingBottom: 8 }}>
            <h1
              style={{
                fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: isMobile ? -1 : -3,
                background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6, #48CAE4)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: heroTextVisible && !taglineFading ? 1 : heroTextVisible ? 0 : 0,
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s",
              }}
            >
              {taglines[taglineIndex].accent}
            </h1>
          </div>

          {/* Tagline bottom */}
          <div style={{ overflow: "hidden", marginBottom: isMobile ? 16 : 32, paddingBottom: 8 }}>
            <h1
              style={{
                fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: isMobile ? -1 : -3,
                opacity: heroTextVisible && !taglineFading ? 1 : heroTextVisible ? 0 : 0,
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.16s",
              }}
            >
              {taglines[taglineIndex].bottom}
            </h1>
          </div>

          {/* Progress dots */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginBottom: isMobile ? 20 : 32,
              opacity: heroTextVisible ? 1 : 0,
              transition: "opacity 1s ease 1s",
            }}
          >
            {taglines.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === taglineIndex ? 32 : 8,
                  height: 3,
                  borderRadius: 2,
                  background: i === taglineIndex ? ADG_CYAN : "rgba(255,255,255,0.15)",
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            ))}
          </div>

          {/* Supporting copy */}
          <div
            style={{
              opacity: heroTextVisible ? 1 : 0,
              transform: heroTextVisible ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 1.2s",
            }}
          >
            <p
              style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 300,
                opacity: 0.6,
                maxWidth: 540,
                margin: "0 auto 40px",
                lineHeight: 1.6,
                padding: isMobile ? "0 4px" : undefined,
              }}
            >
              Florida's teachers, nurses, and first responders deserve quality housing they can
              afford. ADG develops workforce communities that close the gap between income and rent
              — built to institutional standards, designed for real life.
            </p>
          </div>

          {/* Scroll indicator — hidden on mobile */}
          {!isMobile && (
            <div
              style={{
                opacity: heroTextVisible ? 1 : 0,
                transition: "opacity 1.5s ease 1.8s",
                position: "absolute",
                bottom: -120,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <div
                style={{
                  width: 1,
                  height: 60,
                  background: `linear-gradient(180deg, ${ADG_CYAN}, transparent)`,
                  margin: "0 auto",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ===== PORTFOLIO SECTION ===== */}
      <section id="portfolio" style={{ padding: isMobile ? "80px 0 60px" : "120px 0 80px", position: "relative" }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 60px", marginBottom: isMobile ? 32 : 60 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              letterSpacing: 6,
              color: ADG_CYAN,
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}
          >
            Our Portfolio
          </div>
          <h2
            style={{
              fontSize: isMobile ? "clamp(28px, 7vw, 48px)" : "clamp(36px, 5vw, 64px)",
              fontWeight: 800,
              lineHeight: 1.05,
              margin: 0,
              maxWidth: 650,
            }}
          >
            Homes where{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${ADG_CYAN}, #48CAE4)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Florida's workforce
            </span>{" "}
            lives.
          </h2>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollContainerRef}
          onMouseDown={isMobile ? undefined : handleMouseDown}
          onMouseUp={isMobile ? undefined : handleMouseUp}
          onMouseLeave={isMobile ? undefined : handleMouseUp}
          onMouseMove={isMobile ? undefined : handleMouseMove}
          style={{
            display: "flex",
            gap: isMobile ? 16 : 24,
            overflowX: "auto",
            padding: isMobile ? "0 20px 32px" : "0 60px 40px",
            cursor: isMobile ? undefined : "grab",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {projects.map((project, i) => (
            <div
              key={i}
              onClick={() => setActiveProject(activeProject === i ? null : i)}
              style={{
                minWidth: isMobile ? "calc(100vw - 48px)" : 420,
                maxWidth: isMobile ? "calc(100vw - 48px)" : 420,
                height: isMobile ? 480 : 560,
                borderRadius: 16,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                scrollSnapAlign: "start",
                flexShrink: 0,
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: activeProject === i ? "scale(1.02)" : "scale(1)",
              }}
            >
              {/* Project image */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: activeProject === i ? "scale(1.1)" : "scale(1)",
                }}
              >
                <img
                  src={project.image}
                  alt={project.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Gradient fallback behind the image */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(135deg, #023E8A, #03045E)`,
                    zIndex: -1,
                  }}
                />
              </div>

              {/* Gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    activeProject === i
                      ? "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)"
                      : "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.8) 100%)",
                  transition: "all 0.5s",
                }}
              />

              {/* Status badge */}
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  left: 20,
                  padding: "6px 14px",
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${project.statusColor}44`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: project.statusColor,
                  }}
                >
                  {project.status}
                </span>
              </div>

              {/* Project number */}
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  right: 20,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  fontWeight: 400,
                  opacity: 0.4,
                  letterSpacing: 2,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? 20 : 28 }}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: isMobile ? 10 : 11,
                    letterSpacing: 3,
                    color: ADG_CYAN,
                    marginBottom: 8,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {project.type} · {project.units}
                </div>
                <h3 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.1 }}>
                  {project.name}
                </h3>
                <p style={{ fontSize: 14, fontWeight: 400, opacity: 0.6, margin: 0 }}>
                  {project.location}
                </p>

                {/* Expanded description */}
                <div
                  style={{
                    maxHeight: activeProject === i ? 200 : 0,
                    opacity: activeProject === i ? 1 : 0,
                    overflow: "hidden",
                    transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    marginTop: activeProject === i ? 16 : 0,
                  }}
                >
                  <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
                    {project.description}
                  </p>
                  {project.award && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "8px 12px",
                        background: "rgba(0,180,216,0.1)",
                        border: `1px solid ${ADG_CYAN}33`,
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: "'Space Mono', monospace",
                        color: ADG_CYAN,
                        letterSpacing: 1,
                      }}
                    >
                      ★ {project.award}
                    </div>
                  )}
                </div>
              </div>

              {/* Border effect */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 16,
                  border: `1px solid ${activeProject === i ? ADG_CYAN + "66" : "rgba(255,255,255,0.08)"}`,
                  transition: "border-color 0.5s",
                  pointerEvents: "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            opacity: 0.3,
            textTransform: "uppercase" as const,
          }}
        >
          {isMobile ? "← Swipe to explore →" : "← Drag to explore →"}
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section
        style={{
          padding: isMobile ? "48px 20px" : "80px 60px",
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? "24px 16px" : 40,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(0,180,216,0.02)",
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: isMobile ? "clamp(28px, 8vw, 40px)" : "clamp(36px, 4vw, 56px)",
                fontWeight: 900,
                background: `linear-gradient(135deg, #fff, ${ADG_CYAN})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
                marginBottom: 8,
              }}
            >
              <AnimatedCounter target={stat.number} />
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: isMobile ? 9 : 11,
                letterSpacing: isMobile ? 3 : 4,
                opacity: 0.4,
                textTransform: "uppercase" as const,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section
        id="about"
        ref={aboutRef}
        style={{
          padding: compact ? "80px 20px" : "140px 60px",
          position: "relative",
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "1fr 1fr",
          gap: compact ? 40 : 80,
          alignItems: "center",
        }}
      >
        <div
          style={{
            opacity: aboutInView ? 1 : 0,
            transform: aboutInView ? "translateX(0)" : "translateX(-60px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              letterSpacing: 6,
              color: ADG_CYAN,
              marginBottom: 20,
              textTransform: "uppercase" as const,
            }}
          >
            About ADG
          </div>
          <h2
            style={{
              fontSize: compact ? "clamp(28px, 7vw, 40px)" : "clamp(32px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "0 0 24px",
            }}
          >
            Closing the gap{" "}
            <span style={{ fontWeight: 300, fontStyle: "italic" }}>
              between income and rent.
            </span>
          </h2>
          <p style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.8, opacity: 0.6, margin: "0 0 24px" }}>
            Across Florida, essential workers are being priced out of the communities they serve.
            Teachers commute hours to their schools. Nurses can't afford to live near their
            hospitals. ADG was founded to change that — developing high-quality, attainable housing
            that keeps the workforce close to where it's needed most.
          </p>
          <p style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.8, opacity: 0.6, margin: "0 0 32px" }}>
            Every project is built to institutional standards — the same rigor demanded by tax
            credit investors and agency lenders — because the workforce deserves the same quality of
            construction, amenities, and management as any luxury community. With over 1,100 units
            developed or in our pipeline, we're proving that mission-driven development and strong
            returns aren't mutually exclusive.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: `linear-gradient(135deg, ${ADG_CYAN}22, ${ADG_CYAN}08)`,
                border: `1px solid ${ADG_CYAN}33`,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={ADG_CYAN}>
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>SFBJ Structures Awards</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>Best Affordable Residential 2018</div>
            </div>
          </div>
        </div>

        {/* Right column — Closing the gap image */}
        <div
          style={{
            opacity: aboutInView ? 1 : 0,
            transform: aboutInView ? "translateX(0)" : "translateX(60px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
            position: "relative",
            height: compact ? 300 : 500,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <img
              src="/assets/images/website/closing-the-gap.jpg"
              alt="ADG Groundbreaking Ceremony"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 20,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLImageElement).parentElement;
                if (parent) {
                  parent.style.background = `linear-gradient(135deg, ${ADG_CYAN}11, transparent)`;
                  parent.style.border = "1px solid rgba(255,255,255,0.06)";
                }
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(10,10,10,0.15), rgba(0,180,216,0.08))",
                borderRadius: 20,
              }}
            />
          </div>
          {/* Floating cyan blur accent — hidden on mobile */}
          {!compact && (
            <div
              style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 120,
                height: 120,
                background: `linear-gradient(135deg, ${ADG_CYAN}22, transparent)`,
                borderRadius: "50%",
                filter: "blur(40px)",
              }}
            />
          )}
        </div>
      </section>

      {/* ===== TEAM SECTION ===== */}
      <section
        id="team"
        ref={teamRef}
        style={{
          padding: compact ? "80px 20px" : "120px 60px",
          background: `linear-gradient(180deg, transparent, rgba(0,180,216,0.03), transparent)`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: compact ? 48 : 80 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              letterSpacing: 6,
              color: ADG_CYAN,
              marginBottom: 16,
              textTransform: "uppercase" as const,
              opacity: teamInView ? 1 : 0,
              transition: "opacity 0.8s",
            }}
          >
            Leadership
          </div>
          <h2
            style={{
              fontSize: compact ? "clamp(28px, 7vw, 40px)" : "clamp(36px, 5vw, 56px)",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: 0,
              opacity: teamInView ? 1 : 0,
              transform: teamInView ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            The people behind{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${ADG_CYAN}, #48CAE4)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              the mission.
            </span>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)",
            gap: 32,
            maxWidth: compact ? 400 : 1100,
            margin: "0 auto",
          }}
        >
          {teamMembers.map((member, i) => (
            <div
              key={i}
              style={{
                padding: compact ? 28 : 40,
                borderRadius: 16,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
                opacity: teamInView ? 1 : 0,
                transform: teamInView ? "translateY(0)" : "translateY(40px)",
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + i * 0.15}s`,
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = ADG_CYAN + "44";
                e.currentTarget.style.background = "rgba(0,180,216,0.04)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: compact ? 80 : 100,
                  height: compact ? 80 : 100,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${ADG_CYAN}22, ${ADG_CYAN}08)`,
                  border: `2px solid ${ADG_CYAN}33`,
                  margin: "0 auto 24px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 2 }}
                  onLoad={(e) => {
                    const sibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (sibling) sibling.style.display = "none";
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    fontSize: compact ? 24 : 32,
                    fontWeight: 800,
                    color: ADG_CYAN,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <h3 style={{ fontSize: compact ? 20 : 22, fontWeight: 700, margin: "0 0 4px" }}>{member.name}</h3>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  letterSpacing: 3,
                  color: ADG_CYAN,
                  marginBottom: 16,
                  textTransform: "uppercase" as const,
                }}
              >
                {member.title}
              </div>
              <p style={{ fontSize: compact ? 13 : 14, lineHeight: 1.7, opacity: 0.5, margin: 0 }}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section
        id="contact"
        ref={contactRef}
        style={{
          padding: compact ? "80px 20px" : "120px 60px",
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "1fr 1fr",
          gap: compact ? 40 : 80,
        }}
      >
        <div
          style={{
            opacity: contactInView ? 1 : 0,
            transform: contactInView ? "translateX(0)" : "translateX(-40px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 12,
              letterSpacing: 6,
              color: ADG_CYAN,
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}
          >
            Get in Touch
          </div>
          <h2
            style={{
              fontSize: compact ? "clamp(28px, 7vw, 40px)" : "clamp(36px, 4vw, 52px)",
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "0 0 32px",
            }}
          >
            Let's house{" "}
            <span style={{ fontWeight: 300, fontStyle: "italic" }}>Florida's workforce.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              {
                label: "Office",
                value: "7520 SW 57th Avenue Suite G\nSouth Miami, FL 33143",
              },
              { label: "Phone", value: "(786) 315-4400" },
              { label: "Fax", value: "(866) 379-4817" },
              { label: "Leasing", value: "(305) 398-6536" },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 24px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    letterSpacing: 4,
                    color: ADG_CYAN,
                    marginBottom: 8,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 14 : 15,
                    opacity: 0.7,
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div
          style={{
            opacity: contactInView ? 1 : 0,
            transform: contactInView ? "translateX(0)" : "translateX(40px)",
            transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
          }}
        >
          <form
            onSubmit={handleFormSubmit}
            style={{
              padding: compact ? 28 : 48,
              borderRadius: 20,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {(["name", "email", "subject"] as const).map((field) => (
              <div key={field} style={{ marginBottom: 20 }}>
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    letterSpacing: 3,
                    color: ADG_CYAN,
                    textTransform: "uppercase" as const,
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  placeholder={`Your ${field}`}
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: isMobile ? 14 : 15,
                    fontFamily: "'Outfit', sans-serif",
                    outline: "none",
                    transition: "border-color 0.3s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = ADG_CYAN + "66")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 3,
                  color: ADG_CYAN,
                  textTransform: "uppercase" as const,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Message
              </label>
              <textarea
                rows={4}
                placeholder="How can we help?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: isMobile ? 14 : 15,
                  fontFamily: "'Outfit', sans-serif",
                  outline: "none",
                  resize: "vertical",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.target.style.borderColor = ADG_CYAN + "66")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px",
                background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6)`,
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 20px rgba(0,180,216,0.3)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(-2px)";
                (e.target as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,180,216,0.4)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.transform = "translateY(0)";
                (e.target as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,180,216,0.3)";
              }}
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          padding: isMobile ? "32px 20px" : "40px 60px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: isMobile ? "center" : "space-between",
          alignItems: "center",
          gap: isMobile ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/assets/images/website/adg-logo.png"
            alt="ADG"
            style={{
              height: isMobile ? 32 : 40,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span
            style={{
              fontSize: isMobile ? 10 : 12,
              opacity: 0.3,
              fontFamily: "'Space Mono', monospace",
              letterSpacing: 2,
            }}
          >
            © {new Date().getFullYear()} Alcazar Development Group, LLC
          </span>
        </div>
        <button
          onClick={handleSignIn}
          style={{
            background: "rgba(0,180,216,0.1)",
            border: `1px solid ${ADG_CYAN}33`,
            color: ADG_CYAN,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            fontFamily: "'Space Mono', monospace",
            padding: "8px 20px",
            borderRadius: 4,
            transition: "all 0.3s",
            width: isMobile ? "100%" : undefined,
            textAlign: "center" as const,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = "rgba(0,180,216,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = "rgba(0,180,216,0.1)";
          }}
        >
          ADG-OS Platform →
        </button>
      </footer>
    </div>
  );
}
