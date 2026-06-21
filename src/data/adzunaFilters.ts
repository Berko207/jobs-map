const LEGAL_SUFFIXES =
  /\b(s\.?\s*a\.?\s*de\s*c\.?\s*v\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*a\.?\s*p\.?\s*i\.?|sapi|sa de cv|sa|sc)\b/gi;

/** Staffing / recruitment firms — flagged and sorted below direct employers. */
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

/** Known spam or aggregator labels on Adzuna — never treat as employers. */
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

/** Job titles must match for sector assignment (Adzuna tags by search keyword). */
const ADZUNA_JOB_TITLE_RULES: Partial<Record<string, RegExp>> = {
  "Call Center / BPO":
    /call center|centro de contacto|telemarketing|atencion a clientes|atenci[oó]n a clientes|servicio al cliente|customer service|agente telef[oó]nic|ejecutivo telef[oó]nic|representante telef[oó]nic/i,
};

function normalize(name: string): string {
  return String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isStaffingAgency(name: string): boolean {
  const lower = normalize(name);
  return AGENCY_TERMS.some((term) => lower.includes(term));
}

/** Drop junk Adzuna company names (spam labels, job-board masquerading as employers). */
export function shouldExcludeAdzunaEmployer(name: string): boolean {
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

export function jobMatchesAdzunaCategory(
  title: string | undefined,
  category: string,
): boolean {
  const pattern = ADZUNA_JOB_TITLE_RULES[category];
  if (!pattern) return true;
  const text = String(title ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  return pattern.test(text);
}
