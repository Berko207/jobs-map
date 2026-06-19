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

export type CompanySource = "curated" | "denue" | "adzuna";

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

/** Raw record shape written by scripts/scan-denue.mjs */
export interface DenueRecord {
  name: string;
  category: Category;
  zone?: string;
  lat: number;
  lng: number;
  size?: string;
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
