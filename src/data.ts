// Site content, copied verbatim from the original App.tsx
export const projects = [
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

export const limitedPartnerPositions = [
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

export const teamMembers = [
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

export const stats = [
  { number: "1,100+", label: "Units Developed" },
  { number: "3", label: "Active Projects" },
  { number: "10+", label: "Years of Excellence" },
  { number: "$240M+", label: "Development Pipeline" },
];

export const taglines = [
  { top: "Housing the", accent: "Workforce.", bottom: "Strengthening Communities." },
  { top: "Where Florida's", accent: "Workforce", bottom: "Comes Home." },
  { top: "Developing", accent: "What", bottom: "Matters." },
  { top: "Attainable", accent: "Living.", bottom: "Institutional Quality." },
];

