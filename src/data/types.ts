export type Category =
  | "Call Center / BPO"
  | "Software"
  | "Telemetry / IoT"
  | "Robotics / Automation"
  | "Manufacturing / Automotive"
  | "Medical / Biomedical"
  | "Veterinary / Animal Health"
  | "Pharmaceutical"
  | "Media"
  | "Mobility"
  | "Coworking"
  | "Academia / Incubator";

export type CompanySource = "curated" | "denue" | "adzuna";

export interface Company {
  id: string;
  name: string;
  category: Category;
  zone: string;
  city?: string;
  lat: number;
  lng: number;
  website?: string;
  googleRating?: number;
  size?: string;
  note?: string;
  saved?: boolean;
  applied?: boolean;
  openRoles?: number;
  lastPostedAt?: string;
  hiringUrl?: string;
  isAgency?: boolean;
  featured?: boolean;
  source?: CompanySource[];
}

export const CATEGORY_COLORS: Record<Category, string> = {
  "Call Center / BPO": "#38BDF8",
  Software: "#A78BFA",
  "Telemetry / IoT": "#2DD4BF",
  "Robotics / Automation": "#FB923C",
  "Manufacturing / Automotive": "#F59E0B",
  "Medical / Biomedical": "#22D3EE",
  "Veterinary / Animal Health": "#84CC16",
  Pharmaceutical: "#6366F1",
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

/** Home city has full DENUE + Adzuna coverage; others are Adzuna-only (live roles). */
export const HOME_CITY = "Hermosillo";

export interface CityConfig {
  /** Matches Company.city and the Adzuna `where` lookup. */
  name: string;
  /** Short label for compact UI (e.g. MTY). */
  short: string;
  center: [number, number];
  zoom: number;
  /** True for the DENUE-backed home city. */
  home?: boolean;
}

/**
 * Cities people from Hermosillo commonly relocate to for work.
 * Out-of-bound cities are populated from live Adzuna job postings only.
 */
export const CITIES: CityConfig[] = [
  {
    name: "Hermosillo",
    short: "HMO",
    center: HERMOSILLO_CENTER,
    zoom: DEFAULT_ZOOM,
    home: true,
  },
  { name: "Monterrey", short: "MTY", center: [25.6866, -100.3161], zoom: 11 },
  { name: "Guadalajara", short: "GDL", center: [20.6597, -103.3496], zoom: 11 },
  { name: "Tijuana", short: "TIJ", center: [32.5149, -117.0382], zoom: 11 },
  {
    name: "Ciudad de México",
    short: "CDMX",
    center: [19.4326, -99.1332],
    zoom: 11,
  },
  { name: "Querétaro", short: "QRO", center: [20.5888, -100.3899], zoom: 11 },
];

export function cityConfig(name: string): CityConfig {
  return CITIES.find((c) => c.name === name) ?? CITIES[0];
}

/** Raw record shape written by scripts/build-denue.mjs */
export interface DenueRecord {
  name: string;
  category: Category;
  activity: string;
  size?: string;
  website?: string;
  phone?: string;
  lat: number;
  lng: number;
  source: "denue";
  zone?: string;
}

/** Raw record shape written by scripts/scan-adzuna.mjs */
export interface AdzunaRecord {
  name: string;
  category: Category;
  openRoles: number;
  lastPostedAt: string;
  lat: number | null;
  lng: number | null;
  hiringUrl: string;
  isAgency: boolean;
  zone?: string;
}

export interface NominatimCacheEntry {
  lat: number;
  lng: number;
  displayName?: string;
}

export type NominatimCache = Record<string, NominatimCacheEntry>;
