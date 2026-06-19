export type {
  Category,
  Company,
  CompanySource,
  AdzunaRecord,
  DenueRecord,
  CityConfig,
} from "./types";

export {
  CATEGORY_COLORS,
  ALL_CATEGORIES,
  HERMOSILLO_CENTER,
  DEFAULT_ZOOM,
  HOME_CITY,
  CITIES,
  cityConfig,
} from "./types";

export { normalizeName, mergeCompanies } from "./merge";
import type { Company } from "./types";
import mergedData from "./companies.merged.json";

export const COMPANIES = mergedData as Company[];

export const ZONES = [...new Set(COMPANIES.map((c) => c.zone))].sort();

const SIZE_ORDER: Record<string, number> = {
  "1–10": 1,
  "11–50": 2,
  "51–200": 3,
  "201–500": 4,
  "500+": 5,
  "1000+": 6,
};

export function sizeRadius(size?: string, hiring?: boolean): number {
  const base: Record<string, number> = {
    "1–10": 6,
    "11–50": 7,
    "51–200": 8,
    "201–500": 9,
    "500+": 10,
    "1000+": 11,
  };
  const r = size ? (base[size] ?? 8) : 8;
  return hiring ? r + 1 : r;
}

export function sizeSortValue(size?: string): number {
  return size ? (SIZE_ORDER[size] ?? 0) : 0;
}

export function isHiring(company: { openRoles?: number }): boolean {
  return (company.openRoles ?? 0) > 0;
}

export function countHiring(companies: { openRoles?: number }[]): number {
  return companies.filter(isHiring).length;
}
