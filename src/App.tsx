import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Web3Forms access key: delivers contact-form messages by email. Public by design (client-side).
const WEB3FORMS_KEY = "fea77824-b299-49c9-b114-52bb347f7fd6";

const ADG_CYAN = "#00B4D8";
const ADG_DARK = "#0A0A0A";
const ADG_SERIF = "'Playfair Display', Georgia, serif";

const projects = [
  {
    name: "Aura Living",
    location: "Naranja, Florida",
    address: "",
    coords: [25.506306, -80.43595] as [number, number],
    units: "220 Units",
    type: "Affordable Housing",
    status: "BREAKING GROUND Q1 2027",
    statusColor: "#00E676",
    description:
      "An eight-story mid-rise affordable housing development serving households at or below 60% AMI. The community offers a diversified unit mix of one, two, and three-bedroom residences addressing critical workforce housing demand in this submarket.",
    detail: "",
    stats: [
      { label: "Units", value: "220" },
      { label: "Stories", value: "8-story mid-rise" },
      { label: "AMI", value: "At or below 60%" },
      { label: "Role", value: "Developer, Guarantor" },
    ],
    award: null,
    image: "/assets/images/website/aura-living-render-4.jpg",
    gallery: [
      "/assets/images/website/aura-living-render-4.jpg",
      "/assets/images/website/aura-living-render-2.jpg",
      "/assets/images/website/aura-living-render-3.jpg",
      "/assets/images/website/aura-living-render-1.jpg",
    ],
  },
  {
    name: "Aura at Silver Lakes",
    location: "Leesburg, Florida",
    address: "",
    coords: [28.838044, -81.811317] as [number, number],
    units: "256 Units",
    type: "Affordable Housing",
    status: "BREAKING GROUND Q4 2026",
    statusColor: "#00E676",
    description:
      "A 256-unit affordable housing community featuring garden-style apartments with two, three, and four-bedroom residences serving households at or below 60% AMI, addressing critical workforce housing demand in the Lake County MSA.",
    detail: "",
    stats: [
      { label: "Unit mix", value: "2, 3 & 4-bedroom" },
      { label: "AMI", value: "At or below 60%" },
      { label: "Status", value: "Pre-development" },
      { label: "Market", value: "Lake County MSA" },
    ],
    award: null,
    image: "/assets/images/website/aura-at-silver-lakes-site.jpg",
    gallery: [],
  },
  {
    name: "Alcazar Millenium",
    location: "Naranja, Florida",
    address: "SW 150th Ave & SW 280th St, Naranja, FL",
    coords: [25.506342, -80.437331] as [number, number],
    units: "192 Units",
    type: "Affordable Housing",
    status: "IN DEVELOPMENT",
    statusColor: "#FFD60A",
    description: "",
    detail: "",
    stats: [],
    award: null,
    image: "/assets/images/website/alcazar-millenium.jpg",
    gallery: [],
  },
  {
    name: "Alcazar Apartment Villas",
    location: "Naranja, Florida",
    address: "14981 SW 283rd St, Homestead, FL 33033",
    coords: [25.5044, -80.434] as [number, number],
    units: "288 Units",
    type: "Market Rate Apartments",
    status: "SOLD Q4 2021",
    statusColor: "#FF6B35",
    description:
      "Award-winning 288-unit market rent apartment community comprised of twelve buildings with 1, 2 and 3 bedroom units and a resort-style clubhouse.",
    detail: "",
    stats: [
      { label: "Phase I", value: "216 units, 2018" },
      { label: "Phase II", value: "72 units, 2019" },
      { label: "Financing", value: "HUD 221(d)(4)" },
      { label: "Exit", value: "Sold Q1 2021" },
    ],
    award: "SFBJ Structures Awards — Best Affordable Residential",
    image: "/assets/images/website/alcazar-villas-photo-2.jpg",
    gallery: [
      "/assets/images/website/alcazar-villas-photo-2.jpg",
      "/assets/images/website/alcazar-villas-photo-1.jpg",
      "/assets/images/website/alcazar-villas-photo-3.jpg",
      "/assets/images/website/alcazar-villas-photo-4.jpg",
      "/assets/images/website/alcazar-villas-photo-7.jpg",
      "/assets/images/website/alcazar-villas-photo-8.jpg",
      "/assets/images/website/alcazar-villas-photo-9.jpg",
      "/assets/images/website/alcazar-villas-photo-10.jpg",
    ],
  },
  {
    name: "Spring Gardens",
    location: "Miami Health District",
    address: "1005 Spring Garden Rd, Miami, FL 33136",
    coords: [25.785618, -80.211316] as [number, number],
    units: "240 Units",
    type: "Multifamily Development",
    status: "STABILIZED",
    statusColor: "#00E676",
    description:
      "A 240-unit multifamily development located in the Downtown Miami Health District. A joint venture with Estates Investment Group.",
    detail: "",
    stats: [
      { label: "Stories", value: "8" },
      { label: "Delivered", value: "2020, on schedule" },
      { label: "Role", value: "General Partner" },
      { label: "Status", value: "Owned & operated" },
    ],
    award: null,
    image: "/assets/images/website/spring-gardens.jpg",
    gallery: [
      "/assets/images/website/spring-gardens-aerial.jpg",
      "/assets/images/website/spring-gardens-pool.jpg",
      "/assets/images/website/spring-gardens-lounge.jpg",
      "/assets/images/website/spring-gardens-kitchen.jpg",
      "/assets/images/website/spring-gardens-rooftop.jpg",
    ],
  },
];

const limitedPartnerPositions = [
  {
    name: "The Holly by Soleste",
    location: "Hollywood, Florida",
    address: "2001 Van Buren St, Hollywood, FL 33020",
    coords: [26.009647, -80.147081] as [number, number],
    units: "503 Units",
    type: "Class A, Two Towers — QOZ",
    role: "Limited Partner",
    description:
      "A 503-unit, two-tower Class A community adjacent to Young Circle in downtown Hollywood, structured as a Qualified Opportunity Zone investment. GP: The Estate Companies.",
    stats: [
      { label: "Towers", value: "8 & 12 stories" },
      { label: "Construction loan", value: "$70.8M, Nationwide Mutual" },
      { label: "Leased", value: "81% north tower (Q2 2026)" },
      { label: "Structure", value: "Qualified Opportunity Zone" },
    ],
    award: null,
    image: "/assets/images/website/the-holly-by-soleste-aerial.jpg",
    gallery: [
      "/assets/images/website/the-holly-by-soleste-aerial.jpg",
      "/assets/images/website/the-holly-by-soleste-north-tower.jpg",
      "/assets/images/website/the-holly-by-soleste-lobby.jpg",
    ],
  },
  {
    name: "Gran Vista at Doral",
    location: "Doral, Florida",
    address: "4400 NW 79th Ave, Doral, FL 33166",
    coords: [25.814465, -80.326682] as [number, number],
    units: "148 Units",
    type: "Mid-Rise Multifamily",
    role: "Limited Partner",
    description:
      "148-unit multifamily mid-rise located in Doral, FL.",
    stats: [
      { label: "Held since", value: "2011" },
      { label: "Years held", value: "15+" },
    ],
    award: null,
    image: "/assets/images/website/gran-vista-at-doral.jpg",
    gallery: ["/assets/images/website/gran-vista-at-doral.jpg"],
  },
  {
    name: "Cinnamon Cove",
    location: "Tampa, Florida",
    address: "12401 N 15th St, Tampa, FL 33612",
    coords: [28.060726, -82.442751] as [number, number],
    units: "309 Units",
    type: "Garden Multifamily, Value-Add",
    role: "Limited Partner",
    description:
      "309-unit Garden-style value-add community acquired in 2025.",
    stats: [
      { label: "Acquired", value: "2025" },
      { label: "Strategy", value: "Value-add" },
    ],
    award: null,
    image: "/assets/images/website/cinnamon-cove.jpg",
    gallery: ["/assets/images/website/cinnamon-cove.jpg"],
  },
];

const teamMembers = [
  {
    name: "JJ Figueroa",
    title: "Managing Director",
    bio: "Real estate developer, broker, and financier with over two decades of experience. Co-owner and Managing Director of Alcazar Development Group (ADG), where he leads acquisitions, financial modeling, capital structuring, and overall development strategy for the firm's multifamily portfolio throughout Florida. He is also co-founder of Figueroa-Heller Capital Partners, a private mortgage lending platform. Earlier in his career, he worked with Caribe Homes Corporation, contributing to the development and sales of 17 single-family communities across South Florida totaling more than 2,200 homes.",
    image: "/assets/images/website/jj-figueroa.jpg",
  },
  {
    name: "Justo L. Fernandez",
    title: "Managing Director",
    bio: "Real estate development executive with more than four decades of industry experience. As Managing Director and co-owner at Alcazar Development Group, he oversees pre-construction planning, project execution, and construction oversight across ADG's multifamily development pipeline. Prior to entering development, he spent 30 years in the financial industry at Mercantil Commercebank, serving as Executive Vice President and leading the Commercial Real Estate Division while managing a loan portfolio exceeding $1.6 billion.",
    image: "/assets/images/website/justo-fernandez.jpg",
  },
  {
    name: "Guillermo Villar",
    title: "Principal",
    bio: "Principal and strategic advisor at Alcazar Development Group, bringing more than four decades of financial and real estate expertise to the firm's multifamily development initiatives. Prior to joining ADG, he built a distinguished international banking career with Chase and Mercantil, ultimately serving as President and CEO of Commercebank in Miami. His background includes leadership roles in corporate lending, financial management, and global banking operations.",
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

// Esri "Dark Gray Canvas" — a purpose-built dark, muted basemap (base + label layers)
const DARK_BASE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const DARK_LABEL_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";

function makePin(color: string) {
  return L.divIcon({
    className: "adg-pin",
    html: `<span class="adg-pin-halo" style="background:${color}"></span><span class="adg-pin-dot" style="background:${color};box-shadow:0 0 14px ${color}"></span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function createDarkMap(el: HTMLElement, opts: L.MapOptions = {}) {
  const map = L.map(el, {
    scrollWheelZoom: false,
    dragging: !L.Browser.mobile,
    zoomControl: true,
    zoomSnap: 0.25,
    ...opts,
  });
  map.attributionControl.setPrefix(false);
  L.tileLayer(DARK_BASE_TILES, { attribution: TILE_ATTRIBUTION, maxZoom: 16 }).addTo(map);
  L.tileLayer(DARK_LABEL_TILES, { maxZoom: 16 }).addTo(map);
  return map;
}

// Single-property location map shown inside the detail modal
function PropertyMap({ coords, height }: { coords: [number, number]; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = createDarkMap(ref.current, { center: coords, zoom: 15 });
    L.marker(coords, { icon: makePin(ADG_CYAN), keyboard: false }).addTo(map);
    // The modal animates in, so re-measure once it has settled
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      clearTimeout(t);
      map.remove();
    };
  }, [coords[0], coords[1]]);
  return (
    <div
      ref={ref}
      style={{
        height,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        isolation: "isolate",
      }}
    />
  );
}

// Portfolio-wide footprint map — every development and investment position in one view
function FootprintMap({
  height,
  onSelect,
}: {
  height: number;
  onSelect: (item: { kind: "project" | "lp"; index: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const map = createDarkMap(ref.current);
    const points: [number, number][] = [];
    const add = (coords: [number, number], name: string, location: string, color: string, item: { kind: "project" | "lp"; index: number }) => {
      const m = L.marker(coords, { icon: makePin(color), keyboard: false }).addTo(map);
      m.bindTooltip(`<strong>${name}</strong><br/>${location}`, { className: "adg-tip", direction: "top", offset: [0, -12] });
      m.on("click", () => onSelect(item));
      points.push(coords);
    };
    projects.forEach((p, i) => add(p.coords, p.name, p.location, ADG_CYAN, { kind: "project", index: i }));
    limitedPartnerPositions.forEach((p, i) => add(p.coords, p.name, p.location, "#E6E6E6", { kind: "lp", index: i }));
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60] });
    return () => {
      map.remove();
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        height,
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        isolation: "isolate",
      }}
    />
  );
}

export function ADGWebsite() {
  const [scrollY, setScrollY] = useState(0);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<{ kind: "project" | "lp"; index: number } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [shovelGlow, setShovelGlow] = useState(0);
  const [heroTextVisible, setHeroTextVisible] = useState(false);
  const [navSolid, setNavSolid] = useState(false);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [taglineFading, setTaglineFading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [botcheck, setBotcheck] = useState(false);
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

      // Sun-glint on the groundbreaking shovel photo — intensity tracks how far
      // the image has traveled through the viewport as the page scrolls.
      if (aboutRef.current) {
        const rect = aboutRef.current.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 when the section's top just enters the bottom of the viewport,
        // 1 when its bottom reaches the top of the viewport.
        const progress = (vh - rect.top) / (vh + rect.height);
        const clamped = Math.min(1, Math.max(0, progress));
        setShovelGlow(clamped);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
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

  // Lock body scroll when the property modal is open; close on Escape
  useEffect(() => {
    if (modalItem) {
      setGalleryIndex(0);
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setModalItem(null);
      };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
    document.body.style.overflow = "";
  }, [modalItem]);

  // Auto-advance the modal gallery every 5 seconds
  useEffect(() => {
    if (!modalItem) return;
    const gallery =
      modalItem.kind === "project"
        ? projects[modalItem.index].gallery
        : limitedPartnerPositions[modalItem.index].gallery;
    if (!gallery || gallery.length <= 1) return;
    const timer = setTimeout(() => {
      setGalleryIndex((i) => (i + 1) % gallery.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [modalItem, galleryIndex]);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStatus === "sending") return;
    if (botcheck) { setFormStatus("sent"); return; } // spam trap: silently drop bot submissions
    if (!WEB3FORMS_KEY) { setFormStatus("error"); return; }
    setFormStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          from_name: "alcazardg.com contact form",
          subject: `Website inquiry: ${formData.subject || formData.name}`,
          name: formData.name,
          email: formData.email,
          replyto: formData.email,
          topic: formData.subject,
          message: formData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data as { success?: boolean }).success) {
        setFormStatus("sent");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  };

  const handleSignIn = () => {
    window.location.href = "https://adg-os.com";
  };

  const compact = isMobile || isTablet;

  // Sun-glint intensity on the shovel photo — pulses a couple of times as the
  // image travels through the viewport, like a reflective surface catching light.
  const shovelGlintIntensity = Math.pow(Math.abs(Math.sin(shovelGlow * Math.PI * 2.5)), 2);

  const modalData = !modalItem
    ? null
    : modalItem.kind === "project"
    ? {
        ...projects[modalItem.index],
        badge: projects[modalItem.index].status,
        badgeColor: projects[modalItem.index].statusColor,
      }
    : {
        ...limitedPartnerPositions[modalItem.index],
        detail: "",
        badge: limitedPartnerPositions[modalItem.index].role,
        badgeColor: ADG_CYAN,
      };

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
        /* ---- Map styling (dark, on-brand) ---- */
        .leaflet-container { background: #0d0d0f; font-family: 'Outfit', sans-serif; }
        .adg-pin-dot, .adg-pin-halo {
          position: absolute; left: 50%; top: 50%;
          width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%;
        }
        .adg-pin-dot { border: 2px solid #0A0A0A; }
        .adg-pin-halo { animation: adgPulse 2.4s ease-out infinite; }
        @keyframes adgPulse {
          0% { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(3.4); opacity: 0; }
        }
        .leaflet-bar { border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: none !important; }
        .leaflet-bar a {
          background: #141416 !important; color: rgba(255,255,255,0.8) !important;
          border-bottom-color: rgba(255,255,255,0.08) !important;
        }
        .leaflet-bar a:hover { background: #1c1c1f !important; color: #fff !important; }
        .leaflet-control-attribution {
          background: rgba(10,10,10,0.7) !important; color: rgba(255,255,255,0.45) !important; font-size: 10px;
        }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.6) !important; }
        .leaflet-tooltip.adg-tip {
          background: #0d0d0f; color: #fff; border: 1px solid rgba(0,180,216,0.35); border-radius: 6px;
          font-family: 'Outfit', sans-serif; font-size: 12px; line-height: 1.4; padding: 6px 10px; box-shadow: none;
        }
        .leaflet-tooltip.adg-tip::before { display: none; }
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
                letterSpacing: 2.5,
                textTransform: "uppercase" as const,
                fontFamily: "'Outfit', sans-serif",
                opacity: 0.9,
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
              fontSize: 16,
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
                fontSize: isMobile ? 16 : 22,
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
                fontSize: isMobile ? 11 : 13,
                fontWeight: 400,
                letterSpacing: isMobile ? 1 : 3,
                whiteSpace: "nowrap",
                opacity: 0.85,
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
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase" as const,
                fontFamily: "'Space Mono', monospace",
                padding: "8px 14px",
                borderRadius: 4,
                whiteSpace: "nowrap",
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
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: 2,
                  textTransform: "uppercase" as const,
                  fontFamily: "'Space Mono', monospace",
                  opacity: 0.85,
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
                fontSize: 14,
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
          height: isMobile ? "auto" : "100vh",
          padding: isMobile ? "112px 0 56px" : undefined,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
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
                fontSize: isMobile ? 13 : 15,
                fontWeight: 400,
                letterSpacing: isMobile ? 2.5 : 4,
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
                fontFamily: ADG_SERIF,
                fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                fontWeight: 700,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: isMobile ? -0.5 : -1,
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
                fontFamily: ADG_SERIF,
                fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                fontWeight: 700,
                fontStyle: "italic",
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: isMobile ? -0.5 : -1,
                color: ADG_CYAN,
                opacity: heroTextVisible && !taglineFading ? 1 : heroTextVisible ? 0 : 0,
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s",
              }}
            >
              {taglines[taglineIndex].accent}
            </h1>
          </div>

          {/* Tagline bottom — hidden spacer reserves height for the longest line so rotation never shifts the layout */}
          <div style={{ position: "relative", marginBottom: isMobile ? 16 : 32 }}>
            <h1
              aria-hidden="true"
              style={{
                fontFamily: ADG_SERIF,
                fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                fontWeight: 700,
                lineHeight: 1.1,
                margin: 0,
                letterSpacing: isMobile ? -0.5 : -1,
                visibility: "hidden",
              }}
            >
              Strengthening Communities.
            </h1>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", paddingBottom: 8 }}>
              <h1
                style={{
                  fontFamily: ADG_SERIF,
                  fontSize: isMobile ? "clamp(32px, 10vw, 48px)" : "clamp(48px, 8vw, 96px)",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  margin: 0,
                  letterSpacing: isMobile ? -0.5 : -1,
                  opacity: heroTextVisible && !taglineFading ? 1 : heroTextVisible ? 0 : 0,
                  transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.16s",
                }}
              >
                {taglines[taglineIndex].bottom}
              </h1>
            </div>
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
                fontSize: isMobile ? 16 : 18,
                fontWeight: 300,
                opacity: 0.82,
                maxWidth: 540,
                margin: isMobile ? "0 auto" : "0 auto 40px",
                lineHeight: 1.6,
                padding: isMobile ? "0 4px" : undefined,
              }}
            >
              Florida's teachers, nurses, and first responders deserve quality housing they can
              afford. ADG develops workforce communities that close the gap between income and rent
              — built to institutional standards, designed for real life.
            </p>

            {/* Hero CTA: desktop only (phones reach Contact from the menu) */}
            {!isMobile && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: isMobile ? "100%" : undefined,
              }}
            >
              <button
                onClick={() => scrollToSection("contact")}
                style={{
                  background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6)`,
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 700,
                  letterSpacing: isMobile ? 1 : 2,
                  textTransform: "uppercase" as const,
                  fontFamily: "'Space Mono', monospace",
                  padding: isMobile ? "14px 24px" : "16px 36px",
                  borderRadius: 4,
                  boxShadow: "0 0 20px rgba(0,180,216,0.3)",
                  transition: "all 0.3s",
                  width: isMobile ? "100%" : undefined,
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
                Get In Touch
              </button>
            </div>
            )}
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
      <section id="portfolio" style={{ padding: isMobile ? "56px 0 48px" : "104px 0 72px", position: "relative" }}>
        <div style={{ padding: isMobile ? "0 20px" : "0 60px", marginBottom: isMobile ? 32 : 60 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              letterSpacing: 3,
              color: ADG_CYAN,
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}
          >
            Our Portfolio
          </div>
          <h2
            style={{
              fontFamily: ADG_SERIF,
              fontSize: isMobile ? "clamp(28px, 7vw, 48px)" : "clamp(36px, 5vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.1,
              margin: 0,
              maxWidth: 650,
            }}
          >
            Homes where{" "}
            <span
              style={{
                fontStyle: "italic",
                color: ADG_CYAN,
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
              onClick={() => {
                setModalItem({ kind: "project", index: i });
              }}
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
                    fontSize: 13,
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
                  fontSize: 14,
                  fontWeight: 400,
                  opacity: 0.72,
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
                    fontSize: isMobile ? 13 : 13,
                    letterSpacing: 3,
                    color: ADG_CYAN,
                    marginBottom: 8,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {project.type} · {project.units}
                </div>
                <h3 style={{ fontFamily: ADG_SERIF, fontSize: isMobile ? 22 : 26, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.2 }}>
                  {project.name}
                </h3>
                <p style={{ fontSize: 16, fontWeight: 400, opacity: 0.82, margin: 0 }}>
                  {project.location}
                </p>

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
            fontSize: 13,
            letterSpacing: 3,
            opacity: 0.72,
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
                fontFamily: ADG_SERIF,
                fontSize: isMobile ? "clamp(28px, 8vw, 40px)" : "clamp(36px, 4vw, 56px)",
                fontWeight: 700,
                color: ADG_CYAN,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
                marginBottom: 10,
              }}
            >
              <AnimatedCounter target={stat.number} />
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: isMobile ? 12 : 13,
                letterSpacing: isMobile ? 2 : 2.5,
                opacity: 0.72,
                textTransform: "uppercase" as const,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </section>

      {/* ===== LIMITED PARTNER POSITIONS SECTION ===== */}
      <section
        id="lp-positions"
        style={{ padding: isMobile ? "56px 20px" : "96px 60px", position: "relative" }}
      >
        <div style={{ marginBottom: isMobile ? 32 : 56 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              letterSpacing: 3,
              color: ADG_CYAN,
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}
          >
            Investment Portfolio
          </div>
          <p style={{ fontSize: isMobile ? 16 : 16, opacity: 0.82, maxWidth: 560, margin: 0, lineHeight: 1.6 }}>
            Capital positions alongside institutional sponsors.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 20 : 24,
          }}
        >
          {limitedPartnerPositions.map((lp, i) => (
            <div
              key={i}
              onClick={() => setModalItem({ kind: "lp", index: i })}
              style={{
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${ADG_CYAN}55`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ position: "relative", height: 180 }}>
                <img
                  src={lp.image}
                  alt={lp.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.75) 100%)",
                  }}
                />
              </div>
              <div style={{ padding: isMobile ? 18 : 22 }}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    letterSpacing: 2,
                    opacity: 0.82,
                    marginBottom: 6,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {lp.type} · {lp.units}
                </div>
                <h3 style={{ fontFamily: ADG_SERIF, fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{lp.name}</h3>
                <p style={{ fontSize: 15, opacity: 0.82, margin: 0 }}>{lp.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTPRINT MAP SECTION ===== */}
      <section id="footprint" style={{ padding: isMobile ? "40px 20px 60px" : "60px 60px 100px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            gap: 20,
            marginBottom: isMobile ? 24 : 36,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 14,
                letterSpacing: 3,
                color: ADG_CYAN,
                marginBottom: 16,
                textTransform: "uppercase" as const,
              }}
            >
              Our Footprint
            </div>
            <h2
              style={{
                fontFamily: ADG_SERIF,
                fontSize: isMobile ? "clamp(28px, 7vw, 40px)" : "clamp(32px, 4vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Across <span style={{ fontStyle: "italic", color: ADG_CYAN }}>Florida.</span>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "Developments", color: ADG_CYAN },
              { label: "Investment positions", color: "#E6E6E6" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: l.color,
                    boxShadow: `0 0 10px ${l.color}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    letterSpacing: 2,
                    textTransform: "uppercase" as const,
                    opacity: 0.82,
                  }}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <FootprintMap height={isMobile ? 360 : 500} onSelect={setModalItem} />
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section
        id="about"
        ref={aboutRef}
        style={{
          padding: compact ? "64px 20px" : "112px 60px",
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
              fontSize: 14,
              letterSpacing: 3,
              color: ADG_CYAN,
              marginBottom: 20,
              textTransform: "uppercase" as const,
            }}
          >
            About ADG
          </div>
          <h2
            style={{
              fontFamily: ADG_SERIF,
              fontSize: compact ? "clamp(28px, 7vw, 40px)" : "clamp(32px, 4vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: "0 0 24px",
            }}
          >
            Closing the gap{" "}
            <span style={{ fontWeight: 500, fontStyle: "italic", color: ADG_CYAN }}>
              between income and rent.
            </span>
          </h2>
          <p style={{ fontSize: isMobile ? 16 : 16, lineHeight: 1.8, opacity: 0.82, margin: "0 0 24px" }}>
            Across Florida, essential workers are being priced out of the communities they serve.
            Teachers commute hours to their schools. Nurses can't afford to live near their
            hospitals. ADG was founded to change that — developing high-quality, attainable housing
            that keeps the workforce close to where it's needed most.
          </p>
          <p style={{ fontSize: isMobile ? 16 : 16, lineHeight: 1.8, opacity: 0.82, margin: "0 0 32px" }}>
            Every project is built to institutional standards — the same rigor demanded by tax
            credit investors and agency lenders — because the workforce deserves the same quality of
            construction, amenities, and management as any luxury community. With over 1,100 units
            developed or in our pipeline, we're proving that mission-driven development and strong
            returns aren't mutually exclusive.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <img
              src="/assets/images/website/sfbj-structures-award-2026.png"
              alt="SFBJ Structures Awards"
              style={{
                height: 44,
                width: "auto",
                flexShrink: 0,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>SFBJ Structures Awards</div>
              <div style={{ fontSize: 14, opacity: 0.82 }}>Best Affordable Residential 2018</div>
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
            {/* Sun reflection — an elongated specular streak that slides across the
                shovel's polished surface as the page scrolls, like a moving glint
                rather than a static glow */}
            <div
              style={{
                position: "absolute",
                left: `${20 + shovelGlow * 16}%`,
                top: `${54 + shovelGlow * 20}%`,
                width: compact ? 130 : 210,
                height: compact ? 38 : 60,
                transform: `translate(-50%, -50%) rotate(-24deg) scaleX(${0.75 + shovelGlintIntensity * 0.5})`,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(255,255,255,0.98) 0%, rgba(255,240,200,0.85) 20%, rgba(255,205,110,0.4) 46%, rgba(255,180,60,0) 70%)",
                opacity: 0.25 + shovelGlintIntensity * 0.7,
                mixBlendMode: "screen",
                filter: "blur(1.5px)",
                pointerEvents: "none",
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
          padding: compact ? "64px 20px" : "104px 60px",
          background: `linear-gradient(180deg, transparent, rgba(0,180,216,0.03), transparent)`,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: compact ? 48 : 80 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 14,
              letterSpacing: 3,
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
              fontFamily: ADG_SERIF,
              fontSize: compact ? "clamp(28px, 7vw, 40px)" : "clamp(36px, 5vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              opacity: teamInView ? 1 : 0,
              transform: teamInView ? "translateY(0)" : "translateY(30px)",
              transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            The people behind{" "}
            <span
              style={{
                fontStyle: "italic",
                color: ADG_CYAN,
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
                overflow: "hidden",
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
              {/* Portrait: fills the top of the card edge to edge */}
              <div
                style={{
                  margin: compact ? "-28px -28px 24px" : "-40px -40px 28px",
                  aspectRatio: "720 / 456",
                  background: "#000",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={member.image.replace(".jpg", "-card.jpg")}
                  alt={member.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
              <h3 style={{ fontFamily: ADG_SERIF, fontSize: compact ? 20 : 22, fontWeight: 700, margin: "0 0 4px" }}>{member.name}</h3>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 13,
                  letterSpacing: 3,
                  color: ADG_CYAN,
                  marginBottom: 16,
                  textTransform: "uppercase" as const,
                }}
              >
                {member.title}
              </div>
              <p style={{ fontSize: compact ? 15 : 16, lineHeight: 1.7, opacity: 0.82, margin: 0 }}>
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== AFFILIATED COMPANIES ===== */}
      <section id="affiliates" style={{ padding: compact ? "56px 20px 64px" : "88px 60px 96px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, letterSpacing: 3, color: ADG_CYAN, marginBottom: 14, textTransform: "uppercase" as const }}>
            Affiliated Companies
          </div>
          <h2 style={{ fontFamily: ADG_SERIF, fontSize: compact ? "clamp(28px, 7vw, 36px)" : "clamp(32px, 3.4vw, 44px)", fontWeight: 700, lineHeight: 1.15, margin: "0 0 12px" }}>
            Development, brokerage and private lending.
          </h2>
          <p style={{ fontSize: isMobile ? 16 : 17, lineHeight: 1.7, opacity: 0.82, margin: "0 0 32px", maxWidth: 640 }}>
            ADG operates alongside two affiliated firms under common leadership.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: 20 }}>
            {[
              { href: "https://reliantrealestategroup.com", logo: "/assets/images/website/reliant-logo.png", name: "Reliant Real Estate Group", desc: "Florida commercial real estate brokerage. More than $800 million in transactions since 2009." },
              { href: "https://www.fhcp-llc.com", logo: "/assets/images/website/fhcp-logo.png", name: "Figueroa-Heller Capital Partners", desc: "Licensed private lender. More than 200 real estate-backed loans originated and serviced since 2012." },
            ].map((a) => (
              <a
                key={a.name}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 20, padding: isMobile ? 18 : 22, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", textDecoration: "none", color: "#fff" }}
              >
                <div style={{ background: "#fff", borderRadius: 8, width: isMobile ? 84 : 104, height: isMobile ? 84 : 104, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 10 }}>
                  <img src={a.logo} alt={a.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontFamily: ADG_SERIF, fontSize: isMobile ? 19 : 21, fontWeight: 700, marginBottom: 6 }}>{a.name}</div>
                  <div style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.55, opacity: 0.82 }}>{a.desc}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ADG_CYAN, marginTop: 10 }}>Visit website</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section
        id="contact"
        ref={contactRef}
        style={{
          padding: compact ? "64px 20px" : "104px 60px",
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
              fontSize: 14,
              letterSpacing: 3,
              color: ADG_CYAN,
              marginBottom: 16,
              textTransform: "uppercase" as const,
            }}
          >
            Get in Touch
          </div>
          <h2
            style={{
              fontFamily: ADG_SERIF,
              fontSize: compact ? "clamp(28px, 7vw, 40px)" : "clamp(36px, 4vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.15,
              margin: "0 0 32px",
            }}
          >
            Let's house{" "}
            <span style={{ fontWeight: 500, fontStyle: "italic", color: ADG_CYAN }}>Florida's workforce.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              {
                label: "Office",
                value: "7520 SW 57th Avenue Suite G\nSouth Miami, FL 33143",
              },
              { label: "Phone", value: "(305) 772-6191" },
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
                    fontSize: 13,
                    letterSpacing: 2.5,
                    color: ADG_CYAN,
                    marginBottom: 8,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 16 : 16,
                    opacity: 0.85,
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
                    fontSize: 13,
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
                  name={field}
                  required={field !== "subject"}
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
                    fontSize: isMobile ? 16 : 16,
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
                  fontSize: 13,
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
                name="message"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: isMobile ? 16 : 16,
                  fontFamily: "'Outfit', sans-serif",
                  outline: "none",
                  resize: "vertical",
                  transition: "border-color 0.3s",
                }}
                onFocus={(e) => (e.target.style.borderColor = ADG_CYAN + "66")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            {/* Spam trap: hidden from people, filled in by bots */}
            <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" checked={botcheck} onChange={(e) => setBotcheck(e.target.checked)} style={{ display: "none" }} aria-hidden="true" />
            <button
              type="submit"
              disabled={formStatus === "sending"}
              style={{
                opacity: formStatus === "sending" ? 0.7 : 1,
                width: "100%",
                padding: "16px",
                background: `linear-gradient(135deg, ${ADG_CYAN}, #0077B6)`,
                border: "none",
                borderRadius: 8,
                color: "#fff",
                fontSize: 16,
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
              {formStatus === "sending" ? "Sending..." : "Send Message"}
            </button>
            {formStatus === "sent" && (
              <p role="status" style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: "#fff", opacity: 0.9 }}>
                Message sent. We will be in touch shortly.
              </p>
            )}
            {formStatus === "error" && (
              <p role="alert" style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: "#fff", opacity: 0.9 }}>
                Your message could not be sent. Please email{" "}
                <a href="mailto:JJ@alcazardg.com" style={{ color: ADG_CYAN }}>JJ@alcazardg.com</a> or call (305) 772-6191.
              </p>
            )}
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
            src="/assets/images/website/adg-full-logo-white.jpg"
            alt="Alcazar Development Group — Registered Trademark"
            style={{
              height: isMobile ? 40 : 52,
              width: "auto",
              objectFit: "contain",
              borderRadius: 6,
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <span
            style={{
              fontSize: isMobile ? 13 : 14,
              opacity: 0.72,
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
            fontSize: 13,
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

      {/* ===== PROPERTY DETAIL MODAL ===== */}
      {modalData && (
        <div
          onClick={() => setModalItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(5,5,8,0.88)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            padding: isMobile ? 0 : 24,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d0d0f",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: isMobile ? "20px 20px 0 0" : 20,
              width: "100%",
              maxWidth: 880,
              maxHeight: isMobile ? "92vh" : "88vh",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setModalItem(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#fff",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &#x2715;
            </button>

            {/* Gallery */}
            <div style={{ position: "relative", height: isMobile ? 220 : 380, background: "#000" }}>
              <img
                src={modalData.gallery && modalData.gallery.length > 0 ? modalData.gallery[galleryIndex] : modalData.image}
                alt={modalData.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(13,13,15,0.95) 100%)",
                }}
              />
              {modalData.gallery && modalData.gallery.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 0,
                    right: 0,
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                  }}
                >
                  {modalData.gallery.map((_, gi) => (
                    <button
                      key={gi}
                      onClick={() => setGalleryIndex(gi)}
                      style={{
                        width: gi === galleryIndex ? 22 : 8,
                        height: 3,
                        borderRadius: 2,
                        border: "none",
                        background: gi === galleryIndex ? ADG_CYAN : "rgba(255,255,255,0.3)",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: isMobile ? "24px 20px 32px" : "32px 44px 44px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                {modalItem?.kind === "project" && (
                  <span
                    style={{
                      padding: "5px 12px",
                      borderRadius: 4,
                      background: `${modalData.badgeColor}18`,
                      border: `1px solid ${modalData.badgeColor}55`,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      color: modalData.badgeColor,
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {modalData.badge}
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    letterSpacing: 1.5,
                    opacity: 0.72,
                    textTransform: "uppercase" as const,
                  }}
                >
                  {modalData.type} · {modalData.units}
                </span>
              </div>

              <h2 style={{ fontFamily: ADG_SERIF, fontSize: isMobile ? 24 : 32, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.2 }}>
                {modalData.name}
              </h2>
              <p style={{ fontSize: 16, opacity: 0.82, margin: "0 0 24px" }}>{modalData.location}</p>

              {modalData.stats && modalData.stats.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                    gap: 16,
                    padding: isMobile ? "16px 0" : "20px 0",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    marginBottom: 24,
                  }}
                >
                  {modalData.stats.map((s, si) => (
                    <div key={si}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{s.value}</div>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 13,
                          letterSpacing: 1,
                          opacity: 0.72,
                          textTransform: "uppercase" as const,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalData.description && (
                <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.88, margin: "0 0 16px" }}>
                  {modalData.description}
                </p>
              )}
              {modalData.detail && (
                <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.82, margin: 0 }}>{modalData.detail}</p>
              )}

              {modalData.award && (
                <div
                  style={{
                    marginTop: 20,
                    padding: "10px 14px",
                    background: "rgba(0,180,216,0.1)",
                    border: `1px solid ${ADG_CYAN}33`,
                    borderRadius: 6,
                    fontSize: 14,
                    fontFamily: "'Space Mono', monospace",
                    color: ADG_CYAN,
                    letterSpacing: 1,
                    display: "inline-block",
                  }}
                >
                  ★ {modalData.award}
                </div>
              )}

              {/* Location map */}
              {modalData.coords && (
                <div style={{ marginTop: 32 }}>
                  <div
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 13,
                      letterSpacing: 2.5,
                      color: ADG_CYAN,
                      textTransform: "uppercase" as const,
                      marginBottom: 12,
                    }}
                  >
                    Location
                  </div>
                  <PropertyMap key={modalData.name} coords={modalData.coords} height={isMobile ? 180 : 220} />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 12,
                    }}
                  >
                    <span style={{ fontSize: 15, opacity: 0.82 }}>{modalData.address || modalData.location}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${modalData.coords[0]},${modalData.coords[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: "uppercase" as const,
                        color: ADG_CYAN,
                        background: "rgba(0,180,216,0.1)",
                        border: `1px solid ${ADG_CYAN}33`,
                        padding: "8px 16px",
                        borderRadius: 4,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Open in Google Maps →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
