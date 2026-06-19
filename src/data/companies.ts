export type Category =
  | "Call Center / BPO"
  | "Software"
  | "Telemetry / IoT"
  | "Robotics / Automation"
  | "Manufacturing / Automotive"
  | "Media"
  | "Mobility"
  | "Coworking"
  | "Academia / Incubator";

export interface Company {
  id: string;
  name: string;
  category: Category;
  zone: string;
  lat: number;
  lng: number;
  website?: string;
  googleRating?: number;
  size?: string;
  note?: string;
  saved?: boolean;
  applied?: boolean;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  "Call Center / BPO": "#38BDF8",
  Software: "#A78BFA",
  "Telemetry / IoT": "#2DD4BF",
  "Robotics / Automation": "#FB923C",
  "Manufacturing / Automotive": "#F59E0B",
  Media: "#F472B6",
  Mobility: "#34D399",
  Coworking: "#FBBF24",
  "Academia / Incubator": "#818CF8",
};

export const ALL_CATEGORIES: Category[] = Object.keys(
  CATEGORY_COLORS,
) as Category[];

export const HERMOSILLO_CENTER: [number, number] = [29.083, -110.96];
export const DEFAULT_ZOOM = 12;

export const COMPANIES: Company[] = [
  {
    id: "ssg",
    name: "Support Services Group (SSG)",
    category: "Call Center / BPO",
    zone: "Blvd. Solidaridad (Norte)",
    lat: 29.0792492,
    lng: -110.9831945,
    googleRating: 3.2,
    size: "1000+",
    note: "Bilingual BPO since 1998; high-volume entry-level hiring.",
  },
  {
    id: "intugo",
    name: "Intugo",
    category: "Call Center / BPO",
    zone: "Blvd. Solidaridad (Norte)",
    lat: 29.1004923,
    lng: -110.9939812,
    website: "https://intugo.co",
    googleRating: 4.3,
    size: "201–500",
    note: "Nearshore staffing / back-office for US teams.",
  },
  {
    id: "rdi",
    name: "RDI Hermosillo",
    category: "Call Center / BPO",
    zone: "Blvd. Solidaridad (Norte)",
    lat: 29.0867442,
    lng: -110.9860798,
    website: "https://rdicorp.com",
    googleRating: 4.4,
    size: "201–500",
    note: "Contact center & IT; strong culture reviews.",
  },
  {
    id: "ford",
    name: "Ford Stamping & Assembly",
    category: "Manufacturing / Automotive",
    zone: "Parque Industrial (Sur)",
    lat: 29.0131108,
    lng: -110.9180097,
    website: "https://www.ford.mx",
    googleRating: 4.7,
    size: "1000+",
    note: "Flagship auto plant; 120+ Fanuc robots + a Boston Dynamics Spot.",
  },
  {
    id: "te-connectivity",
    name: "TE Connectivity",
    category: "Manufacturing / Automotive",
    zone: "Parque Industrial (Norte)",
    lat: 29.1891011,
    lng: -111.0095083,
    website: "https://www.te.com",
    googleRating: 4.6,
    size: "1000+",
    note: "Connectors/electronics manufacturing + R&D/product engineering.",
  },
  {
    id: "sisa",
    name: "SISA Sistemas Automatizados",
    category: "Robotics / Automation",
    zone: "Parque Industrial (Sur)",
    lat: 29.0211222,
    lng: -110.9006092,
    website: "https://sisaautomation.com",
    googleRating: 4.8,
    size: "51–200",
    note: "Industrial automation: robotic cells, conveyors, process control.",
  },
  {
    id: "didcom",
    name: "Didcom",
    category: "Telemetry / IoT",
    zone: "Quinta Emilia (Oeste)",
    lat: 29.0937596,
    lng: -111.0191268,
    website: "https://didcom.com.mx",
    googleRating: 4.9,
    size: "51–200",
    note: "World-class fleet telematics / telemetry.",
  },
  {
    id: "coforge-encora",
    name: "Coforge (ex-Nearsoft / Encora)",
    category: "Software",
    zone: "Quinta Emilia (Oeste)",
    lat: 29.0974438,
    lng: -111.0219734,
    website: "https://www.encora.com",
    googleRating: 4.8,
    size: "500+",
    note: "Flagship software dev house; 'best place to code' lineage.",
  },
  {
    id: "aviada",
    name: "Aviada / Aviada Labs",
    category: "Software",
    zone: "Centro",
    lat: 29.0773046,
    lng: -110.9616907,
    website: "https://aviada.mx",
    googleRating: 5.0,
    size: "51–200",
    note: "Local software studio; hosts community events.",
  },
  {
    id: "proyecto-puente",
    name: "Proyecto Puente",
    category: "Media",
    zone: "Centro",
    lat: 29.0881982,
    lng: -110.9562304,
    website: "https://www.proyectopuente.com.mx",
    googleRating: 4.7,
    size: "11–50",
    note: "Independent digital newsroom.",
  },
  {
    id: "el-imparcial",
    name: "El Imparcial",
    category: "Media",
    zone: "Centro",
    lat: 29.0755697,
    lng: -110.9547635,
    website: "https://www.elimparcial.com",
    googleRating: 4.5,
    size: "201–500",
    note: "Sonora's legacy newspaper.",
  },
  {
    id: "welo",
    name: "Welo",
    category: "Mobility",
    zone: "Centro",
    lat: 29.0902732,
    lng: -110.9558231,
    website: "https://welo.mx",
    googleRating: 3.3,
    size: "51–200",
    note: "Sonora-grown ride/logistics app.",
  },
  {
    id: "sheltr-valle",
    name: "SHELTR Workspace (Valle)",
    category: "Coworking",
    zone: "Valle",
    lat: 29.0824787,
    lng: -110.9716143,
    googleRating: 5.0,
    size: "1–10",
    note: "Solar-powered cowork; community events.",
  },
  {
    id: "avanti-kino",
    name: "Avanti Grand Kino",
    category: "Coworking",
    zone: "Pitic / Kino",
    lat: 29.0970824,
    lng: -110.937531,
    website: "https://centrosavanti.com",
    googleRating: 4.7,
    size: "1–10",
    note: "Business-center coworking, Blvd. Kino.",
  },
  {
    id: "unison",
    name: "Universidad de Sonora",
    category: "Academia / Incubator",
    zone: "Centro",
    lat: 29.0834761,
    lng: -110.9603621,
    website: "http://www.uson.mx",
    googleRating: 4.8,
    size: "1000+",
    note: "UniSon + startup incubator (Edificio 3-B).",
  },
  {
    id: "tec-sonora-norte",
    name: "Tec de Monterrey (Sonora Norte)",
    category: "Academia / Incubator",
    zone: "Tec (Norte)",
    lat: 29.169771,
    lng: -110.911208,
    website: "https://tec.mx/es/sonora-norte",
    googleRating: 4.8,
    size: "500+",
    note: "North campus; innovation & prototyping habitat.",
  },
];

export const ZONES = [...new Set(COMPANIES.map((c) => c.zone))].sort();

const SIZE_ORDER: Record<string, number> = {
  "1–10": 1,
  "11–50": 2,
  "51–200": 3,
  "201–500": 4,
  "500+": 5,
  "1000+": 6,
};

export function sizeRadius(size?: string): number {
  const base: Record<string, number> = {
    "1–10": 6,
    "11–50": 7,
    "51–200": 8,
    "201–500": 9,
    "500+": 10,
    "1000+": 11,
  };
  return size ? (base[size] ?? 8) : 8;
}

export function sizeSortValue(size?: string): number {
  return size ? (SIZE_ORDER[size] ?? 0) : 0;
}
