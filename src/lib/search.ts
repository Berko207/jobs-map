import type { Category, Company } from "@/data/types";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/** Search terms → sector. Includes common typos and Spanish variants. */
const CATEGORY_ALIASES: Partial<Record<Category, readonly string[]>> = {
  "Veterinary / Animal Health": [
    "vet",
    "veterinaria",
    "veteriania",
    "veterinario",
    "veterin",
    "animal health",
    "mascota",
    "mascotas",
    "zootecnia",
    "zootec",
    "ganaderia",
    "pecuario",
    "agropecuaria",
  ],
  Pharmaceutical: [
    "pharma",
    "farmaceut",
    "farmac",
    "pfizer",
    "medicament",
    "laboratorio",
    "biotecn",
  ],
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n];
}

function fuzzyMatch(query: string, term: string): boolean {
  if (term.includes(query) || query.includes(term)) return true;
  if (query.length < 5 || term.length < 5) return false;
  return levenshtein(query, term) <= 2;
}

function queryMatchesCategory(query: string, category: Category): boolean {
  const catText = normalizeText(category);
  if (catText.includes(query)) return true;

  const aliases = CATEGORY_ALIASES[category];
  if (!aliases) return false;

  return aliases.some((alias) => fuzzyMatch(query, normalizeText(alias)));
}

export function matchesCompanySearch(company: Company, rawQuery: string): boolean {
  const query = normalizeText(rawQuery);
  if (!query) return true;

  const fields = [company.name, company.category, company.zone, company.note ?? ""];
  if (fields.some((field) => normalizeText(field).includes(query))) return true;

  return queryMatchesCategory(query, company.category);
}
