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

/** Supermarket / retail chains — excluded from DENUE; don't re-import via Adzuna as BPO. */
const RETAIL_CHAIN_TERMS = [
  "casa ley",
  "soriana",
  "chedraui",
  "walmart",
  "bodega aurrera",
  "oxxo",
  "circle k",
  "seven eleven",
  "7 eleven",
  "alsuper",
  "calimax",
  "heb",
  "costco",
  "sam s club",
  "sams club",
  "tiendas extra",
  "la comer",
  "fresko",
  "tienda neto",
  "supermercado",
  "minisuper",
  "abarrotes",
  "grupo fame",
  "calzado fame",
  "banco azteca",
  "elektra",
  "coppel",
  "liverpool",
  "palacio de hierro",
  "suburbia",
  "office depot",
  "office max",
];

/** Generic Adzuna placeholders — not real employer names. */
const GENERIC_EMPLOYER_TERMS = [
  "importante empresa",
  "empresa del sector",
  "empresa lider",
  "empresa reconocida",
  "empresa confidencial",
  "nombre confidencial",
  "global company",
  "multinational company",
  "important company",
  "leading company",
  "reputable company",
];

/** Job titles must match. Adzuna returns the search keyword, not a sector. */
const ADZUNA_JOB_TITLE_RULES = {
  "Call Center / BPO":
    /call center|centro de contacto|telemarketing|atencion a clientes|atenci[oó]n a clientes|servicio al cliente|customer service|agente telef[oó]nic|ejecutivo telef[oó]nic|representante telef[oó]nic/i,
  Software:
    /\bsoftware\b|desarrollador|developer|programmer|programador|full[\s-]?stack/i,
  "Telemetry / IoT": /telemetr|rastreo|\bgps\b|\biot\b|flotilla/i,
  "Robotics / Automation":
    /automatizaci[oó]n|rob[oó]tic|\bplc\b|control industrial/i,
  "Manufacturing / Automotive":
    /automotriz|autoparte|aeroespacial|maquila|ensamble|operador de producci[oó]n/i,
  "Medical / Biomedical":
    /biomed|laboratorio cl[ií]nico|equipo m[eé]dico|hospital/i,
  "Veterinary / Animal Health": /veterinar|zootec|pecuario|mascota/i,
  Pharmaceutical: /farmac[eé]utic|medicamento/i,
  Media: /periodista|reportero|redactor|locutor|noticiero|conductor de noticias/i,
  Mobility: /conductor|repartidor|log[ií]stica|chofer|ultima milla/i,
};

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
  if (RETAIL_CHAIN_TERMS.some((term) => norm.includes(term))) return true;
  if (GENERIC_EMPLOYER_TERMS.some((term) => norm.includes(term))) return true;

  return false;
}

export function jobMatchesAdzunaCategory(title, category) {
  const pattern = ADZUNA_JOB_TITLE_RULES[category];
  if (!pattern) return false;
  const text = String(title ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return pattern.test(text);
}
