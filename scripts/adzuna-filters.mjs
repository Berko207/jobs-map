/**
 * Adzuna employer filters — keep in sync with src/data/adzunaFilters.ts
 */

const LEGAL_SUFFIXES =
  /\b(s\.?\s*a\.?\s*de\s*c\.?\s*v\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*a\.?\s*p\.?\s*i\.?|sapi|sa de cv|sa|sc)\b/gi;

const AGENCY_TERMS = [
  "reclutamiento",
  "capital humano",
  "recursos humanos",
  "seleccion de personal",
  "staffing",
  "headhunt",
  "outsourcing",
  "manpower",
  "adecco",
  "kelly",
  "randstad",
  "sonora jobs",
  "sonorajobs",
  "bolsa de empleo",
  "portal de empleo",
];

const ADZUNA_BLOCKLIST = new Set([
  "unemplojorempleo",
  "miempleojorempleo",
  "tuempleojorempleo",
]);

const AGGREGATOR_TERMS = [
  "jobijoba",
  "jooble",
  "neuvoo",
  "opcionempleo",
  "talenteca",
  "occ mundo",
  "bumeran",
];

function normalize(name) {
  return String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isStaffingAgency(name) {
  const lower = normalize(name);
  return AGENCY_TERMS.some((term) => lower.includes(term));
}

export function shouldExcludeAdzunaEmployer(name) {
  const norm = normalize(name);
  const compact = norm.replace(/\s/g, "");

  if (ADZUNA_BLOCKLIST.has(compact)) return true;
  if (/empleo.*empleo|trabajo.*trabajo|vacante.*vacante|reclut.*reclut/.test(compact)) {
    return true;
  }
  if (AGGREGATOR_TERMS.some((term) => norm.includes(term))) return true;

  return false;
}
