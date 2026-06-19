import { isStaffingAgency, shouldExcludeAdzunaEmployer } from "./adzunaFilters";
import { CURATED_FEATURED } from "./curatedFeatured";
import type {
  AdzunaRecord,
  Category,
  Company,
  CompanySource,
  DenueRecord,
  NominatimCache,
} from "./types";

const LEGAL_SUFFIXES =
  /\b(s\.?\s*a\.?\s*de\s*c\.?\s*v\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*a\.?\s*p\.?\s*i\.?|sapi|sa de cv|sa|sc)\b/gi;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugFromName(name: string): string {
  const base = normalizeName(name)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
  return base || "employer";
}

interface MergeBucket {
  name: string;
  key: string;
  category: Category;
  zone: string;
  lat?: number;
  lng?: number;
  website?: string;
  googleRating?: number;
  size?: string;
  note?: string;
  featured?: boolean;
  openRoles?: number;
  lastPostedAt?: string;
  hiringUrl?: string;
  isAgency?: boolean;
  sources: Set<CompanySource>;
}

function ensureBucket(
  map: Map<string, MergeBucket>,
  name: string,
): MergeBucket {
  const key = normalizeName(name);
  let bucket = map.get(key);
  if (!bucket) {
    bucket = {
      name,
      key,
      category: "Software",
      zone: "Hermosillo",
      sources: new Set(),
    };
    map.set(key, bucket);
  }
  return bucket;
}

function hasCoords(b: MergeBucket): boolean {
  return b.lat != null && b.lng != null;
}

function applyCurated(map: Map<string, MergeBucket>): void {
  for (const c of CURATED_FEATURED) {
    const b = ensureBucket(map, c.name);
    b.name = c.name;
    b.category = c.category;
    b.zone = c.zone;
    b.lat = c.lat;
    b.lng = c.lng;
    b.website = c.website;
    b.googleRating = c.googleRating;
    b.size = c.size;
    b.note = c.note;
    b.featured = true;
    b.sources.add("curated");
  }
}

function applyDenue(map: Map<string, MergeBucket>, records: DenueRecord[]): void {
  for (const d of records) {
    const b = ensureBucket(map, d.name);
    if (!b.sources.has("curated")) {
      b.name = d.name;
      b.category = d.category;
    }
    if (d.zone) b.zone = d.zone;
    if (d.lat != null && d.lng != null) {
      if (!b.sources.has("curated")) {
        b.lat = d.lat;
        b.lng = d.lng;
      }
    }
    if (d.size) b.size = d.size;
    if (d.website && !b.website) b.website = d.website;
    b.sources.add("denue");
  }
}

function applyAdzuna(map: Map<string, MergeBucket>, records: AdzunaRecord[]): void {
  for (const a of records) {
    if (shouldExcludeAdzunaEmployer(a.name)) continue;

    const b = ensureBucket(map, a.name);
    if (!b.sources.has("curated")) {
      b.name = a.name;
      b.category = a.category;
    }
    if (a.zone && !b.sources.has("curated")) b.zone = a.zone;
    if (a.lat != null && a.lng != null && !hasCoords(b)) {
      b.lat = a.lat;
      b.lng = a.lng;
    }
    b.openRoles = Math.max(b.openRoles ?? 0, a.openRoles);
    if (
      !b.lastPostedAt ||
      (a.lastPostedAt && a.lastPostedAt > b.lastPostedAt)
    ) {
      b.lastPostedAt = a.lastPostedAt;
    }
    b.hiringUrl = a.hiringUrl;
    b.isAgency = a.isAgency || b.isAgency || isStaffingAgency(a.name);
    b.sources.add("adzuna");
  }
}

function applyNominatimCache(
  map: Map<string, MergeBucket>,
  cache: NominatimCache,
): void {
  for (const b of map.values()) {
    if (hasCoords(b)) continue;
    const cached = cache[b.key];
    if (cached?.lat != null && cached?.lng != null) {
      b.lat = cached.lat;
      b.lng = cached.lng;
    }
  }
}

/** Merge curated featured + DENUE + Adzuna (+ optional Nominatim cache). */
export function mergeCompanies(
  denueData: DenueRecord[],
  adzunaData: AdzunaRecord[],
  cache: NominatimCache = {},
): Company[] {
  const map = new Map<string, MergeBucket>();

  applyCurated(map);
  applyDenue(map, denueData);
  applyAdzuna(map, adzunaData);
  applyNominatimCache(map, cache);

  const usedIds = new Set<string>();
  const companies: Company[] = [];

  for (const b of map.values()) {
    if (!hasCoords(b)) continue;

    let id = slugFromName(b.name);
    if (usedIds.has(id)) {
      id = `${id}-${b.key.slice(0, 8)}`;
    }
    usedIds.add(id);

    companies.push({
      id,
      name: b.name,
      category: b.category,
      zone: b.zone,
      lat: b.lat!,
      lng: b.lng!,
      website: b.website,
      googleRating: b.googleRating,
      size: b.size,
      note: b.note,
      featured: b.featured,
      openRoles: b.openRoles,
      lastPostedAt: b.lastPostedAt,
      hiringUrl: b.hiringUrl,
      isAgency: b.isAgency,
      source: [...b.sources],
    });
  }

  return companies.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    if (a.isAgency && !b.isAgency) return 1;
    if (!a.isAgency && b.isAgency) return -1;
    return a.name.localeCompare(b.name);
  });
}
