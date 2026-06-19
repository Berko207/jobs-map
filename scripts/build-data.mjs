#!/usr/bin/env node
/**
 * Build-time data pipeline for Vercel deploys.
 * (1) Parse committed data/denue_sonora.csv.gz
 * (2) Fetch Adzuna (non-fatal)
 * (3) Merge via merge.ts → companies.merged.json
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { isStaffingAgency, shouldExcludeAdzunaEmployer } from "./adzuna-filters.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GZ_PATH = path.join(ROOT, "data/denue_sonora.csv.gz");
const DENUE_OUT = path.join(ROOT, "src/data/companies.denue.json");
const ADZUNA_OUT = path.join(ROOT, "src/data/companies.adzuna.json");

const ADZUNA_TIMEOUT_MS = 90_000;
const ADZUNA_REQUEST_TIMEOUT_MS = 15_000;
const ADZUNA_DELAY_MS = 300;
const ADZUNA_MAX_PAGES = 3;

const CITIES_OUT = path.join(ROOT, "src/data/companies.cities.json");
const CITIES_TIMEOUT_MS = 120_000;

/**
 * Out-of-bound cities people from Hermosillo commonly relocate to.
 * Populated from live Adzuna postings only (no DENUE census for other states).
 * Keep `name`/`center` in sync with CITIES in src/data/types.ts.
 */
const OUT_OF_BOUND_CITIES = [
  { name: "Monterrey", where: "Monterrey", center: [25.6866, -100.3161] },
  { name: "Guadalajara", where: "Guadalajara", center: [20.6597, -103.3496] },
  { name: "Tijuana", where: "Tijuana", center: [32.5149, -117.0382] },
  { name: "Ciudad de México", where: "Ciudad de Mexico", center: [19.4326, -99.1332] },
  { name: "Querétaro", where: "Queretaro", center: [20.5888, -100.3899] },
];

const SECTOR_KEYWORDS = {
  "Call Center / BPO": ["call center", "centro de contacto", "bilingual"],
  Software: ["software", "desarrollador", "developer"],
  "Telemetry / IoT": ["telemetria", "iot", "gps"],
  "Robotics / Automation": ["automatizacion", "robotics", "controls"],
  "Manufacturing / Automotive": ["manufactura", "produccion", "automotriz"],
  "Medical / Biomedical": [
    "medico",
    "enfermer",
    "biomed",
    "laboratorio clinico",
    "hospital",
  ],
  "Veterinary / Animal Health": [
    "veterin",
    "animal health",
    "mascota",
    "zootec",
    "alimentos para animales",
  ],
  Pharmaceutical: [
    "farmaceut",
    "pharmaceutical",
    "laboratorio",
    "biotecn",
    "quimico farmaceut",
  ],
  Media: ["medios", "periodista", "contenido"],
  Mobility: ["logistica", "transporte"],
};

/** Retail, food service, and personal services — not career-target employers. */
const EXCLUDE_CODE_PREFIXES = ["46", "47", "72", "81", "812"];

/** Micro-businesses misclassified under manufacturing codes in DENUE. */
const EXCLUDE_ACTIVITY =
  /tortilla|panificaci[oó]n tradicional|abarrote|llanta|neum[aá]t|vulcaniz|revitalizaci[oó]n de llantas|peluquer|belleza|restaurante|ferreter[ií]a|miscel[aá]nea|lavander|tintorer|joyer[ií]a de metales|taquer|fonda|minisuper|dulces y materias primas|cerveza|plantas y flores|art[ií]culos usados|embutidos y otras conservas|helados y paletas|botanas|preparaci[oó]n de alimentos frescos|comercio al por menor/i;

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(
      /\b(s\.?\s*a\.?\s*de\s*c\.?\s*v\.?|s\.?\s*de\s*r\.?\s*l\.?|s\.?\s*a\.?\s*p\.?\s*i\.?|sapi|sa de cv|sa|sc)\b/gi,
      " ",
    )
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapPerOcu(text) {
  const t = String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  if (/0\s*a\s*5/.test(t)) return "1–10";
  if (/6\s*a\s*10/.test(t)) return "1–10";
  if (/11\s*a\s*30/.test(t)) return "11–50";
  if (/31\s*a\s*50/.test(t)) return "11–50";
  if (/51\s*a\s*100/.test(t)) return "51–200";
  if (/101\s*a\s*250/.test(t)) return "201–500";
  if (/251/.test(t)) return "500+";
  return undefined;
}

function shouldExcludeDenueRow(codigoAct, nombreAct, nomEstab) {
  const code = String(codigoAct ?? "").trim();
  if (EXCLUDE_CODE_PREFIXES.some((prefix) => code.startsWith(prefix))) {
    return true;
  }
  const text = `${nombreAct ?? ""} ${nomEstab ?? ""}`;
  return EXCLUDE_ACTIVITY.test(text);
}

function categorize(codigoAct, nombreAct) {
  const code = String(codigoAct ?? "").trim();
  const act = String(nombreAct ?? "").toLowerCase();

  if (
    code.startsWith("3254") ||
    code.startsWith("433110") ||
    code.startsWith("434222")
  ) {
    return "Pharmaceutical";
  }
  if (
    /fabricaci[oó]n de preparaciones farmac[eé]uticas|productos farmac[eé]uticos|qu[ií]micos para la industria farmac[eé]utica/i.test(
      act,
    )
  ) {
    return "Pharmaceutical";
  }

  if (
    code.startsWith("54194") ||
    code.startsWith("434112") ||
    code.startsWith("311110")
  ) {
    return "Veterinary / Animal Health";
  }
  if (
    /servicios veterinarios|medicamentos veterinarios|alimentos para animales|zootec/i.test(
      act,
    )
  ) {
    return "Veterinary / Animal Health";
  }

  if (
    code.startsWith("33911") ||
    code.startsWith("541714") ||
    code.startsWith("541380") ||
    code.startsWith("6215") ||
    code.startsWith("622") ||
    /^621[1-9]/.test(code)
  ) {
    return "Medical / Biomedical";
  }
  if (
    /biomed|equipo m[eé]dico|dispositivo m[eé]dic|instrumento.*m[eé]dic|laboratorio cl[ií]nico|hospital|cl[ií]nica/i.test(
      act,
    )
  ) {
    return "Medical / Biomedical";
  }

  if (code.startsWith("561422") || code.startsWith("5614")) {
    return "Call Center / BPO";
  }
  if (code.startsWith("5415") || code.startsWith("5112")) {
    return "Software";
  }
  if (
    code.startsWith("31") ||
    code.startsWith("32") ||
    code.startsWith("33")
  ) {
    return "Manufacturing / Automotive";
  }
  if (
    code.startsWith("511") ||
    code.startsWith("515") ||
    code.startsWith("5191")
  ) {
    return "Media";
  }
  if (code.startsWith("485")) {
    return "Mobility";
  }

  if (/telemetr|rastreo|gps|monitoreo/i.test(act)) {
    return "Telemetry / IoT";
  }
  if (/automatiz|robot|control industrial/i.test(act)) {
    return "Robotics / Automation";
  }

  return null;
}

function parseCoord(value) {
  const n = parseFloat(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function dedupeKey(name, lat, lng) {
  return `${normalizeName(name)}|${lat.toFixed(5)}|${lng.toFixed(5)}`;
}

function parseDenueCsvGz() {
  if (!fs.existsSync(GZ_PATH)) {
    console.warn(
      `Warning: ${GZ_PATH} not found — using existing ${path.relative(ROOT, DENUE_OUT)} or [].`,
    );
    return readJson(DENUE_OUT, []);
  }

  const compressed = fs.readFileSync(GZ_PATH);
  const raw = gunzipSync(compressed).toString("latin1");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });

  /** @type {Map<string, object>} */
  const byKey = new Map();

  for (const row of rows) {
    const municipio = String(row.municipio ?? "").trim();
    if (municipio !== "Hermosillo") continue;

    const lat = parseCoord(row.latitud);
    const lng = parseCoord(row.longitud);
    if (lat == null || lng == null) continue;

    const name =
      String(row.nom_estab ?? "").trim() ||
      String(row.raz_social ?? "").trim();
    if (!name) continue;

    const activity = String(row.nombre_act ?? "").trim();
    if (shouldExcludeDenueRow(row.codigo_act, activity, name)) continue;

    const category = categorize(row.codigo_act, activity);
    if (!category) continue;

    const website = String(row.www ?? "").trim() || undefined;
    const phone = String(row.telefono ?? "").trim() || undefined;
    const size = mapPerOcu(row.per_ocu);

    const record = {
      name,
      category,
      activity,
      size,
      website,
      phone,
      lat,
      lng,
      source: "denue",
    };

    const key = dedupeKey(name, lat, lng);
    if (!byKey.has(key)) byKey.set(key, record);
  }

  return [...byKey.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isHermosilloArea(location) {
  if (!location?.area) return false;
  const areas = location.area.map((a) => String(a).toLowerCase());
  return areas.some(
    (a) => a.includes("hermosillo") || a.includes("sonora"),
  );
}

function adzunaHiringUrl(companyName) {
  const q = encodeURIComponent(companyName);
  return `https://www.adzuna.com.mx/search?q=${q}&w=Hermosillo%2C%20Sonora`;
}

async function fetchAdzunaPage(appId, appKey, page, keyword, where, signal) {
  const url =
    `https://api.adzuna.com/v1/api/jobs/mx/search/${page}` +
    `?app_id=${encodeURIComponent(appId)}` +
    `&app_key=${encodeURIComponent(appKey)}` +
    `&results_per_page=50` +
    `&where=${encodeURIComponent(where)}` +
    `&what=${encodeURIComponent(keyword)}` +
    `&content-type=application/json`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Adzuna HTTP ${res.status} for "${keyword}" page ${page}`);
  }
  return res.json();
}

async function fetchAdzuna() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn(
      "Warning: ADZUNA_APP_ID / ADZUNA_APP_KEY not set — skipping Adzuna fetch.",
    );
    console.warn(
      "  Add both in Vercel → Project Settings → Environment Variables.",
    );
    return readJson(ADZUNA_OUT, []);
  }

  const deadline = Date.now() + ADZUNA_TIMEOUT_MS;
  /** @type {Map<string, object>} */
  const byCompany = new Map();

  try {
    for (const [category, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      for (const keyword of keywords) {
        if (Date.now() >= deadline) {
          throw new Error("Adzuna fetch exceeded overall time budget");
        }

        for (let page = 1; page <= ADZUNA_MAX_PAGES; page++) {
          if (Date.now() >= deadline) {
            throw new Error("Adzuna fetch exceeded overall time budget");
          }

          let data;
          try {
            data = await fetchAdzunaPage(
              appId,
              appKey,
              page,
              keyword,
              "Hermosillo",
              AbortSignal.timeout(ADZUNA_REQUEST_TIMEOUT_MS),
            );
          } catch (err) {
            throw new Error(
              err instanceof Error ? err.message : String(err),
            );
          }

          const results = data.results ?? [];
          if (results.length === 0) break;

          for (const job of results) {
            if (!isHermosilloArea(job.location)) continue;

            const displayName = job.company?.display_name?.trim();
            if (!displayName || shouldExcludeAdzunaEmployer(displayName)) continue;

            const key = normalizeName(displayName);
            const created = job.created ?? "";
            const lat = job.location?.latitude ?? job.latitude ?? null;
            const lng = job.location?.longitude ?? job.longitude ?? null;

            let entry = byCompany.get(key);
            if (!entry) {
              entry = {
                name: displayName,
                category,
                openRoles: 0,
                lastPostedAt: "",
                lat: lat != null ? Number(lat) : null,
                lng: lng != null ? Number(lng) : null,
                hiringUrl: adzunaHiringUrl(displayName),
                isAgency: isStaffingAgency(displayName),
              };
              byCompany.set(key, entry);
            }

            entry.openRoles += 1;
            if (created > entry.lastPostedAt) entry.lastPostedAt = created;
            if (entry.lat == null && lat != null) entry.lat = Number(lat);
            if (entry.lng == null && lng != null) entry.lng = Number(lng);
          }

          if (results.length < 50) break;
          await sleep(ADZUNA_DELAY_MS);
        }
        await sleep(ADZUNA_DELAY_MS);
      }
    }

    const output = [...byCompany.values()].sort(
      (a, b) => b.openRoles - a.openRoles || a.name.localeCompare(b.name),
    );
    console.log(
      `Adzuna: ${output.length} employers (${output.reduce((s, e) => s + e.openRoles, 0)} open roles)`,
    );
    return output;
  } catch (err) {
    console.warn(
      `Warning: Adzuna fetch failed — ${err instanceof Error ? err.message : err}`,
    );
    console.warn(
      `  Continuing with existing ${path.relative(ROOT, ADZUNA_OUT)} or [].`,
    );
    return readJson(ADZUNA_OUT, []);
  }
}

function slug(text) {
  return (
    normalizeName(text)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 48) || "x"
  );
}

/** Stable pseudo-random offset (~±4km) so coord-less postings don't stack. */
function jitterFromName(name, center) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  const dLat = ((h % 1000) / 1000 - 0.5) * 0.08;
  const dLng = (((h >>> 10) % 1000) / 1000 - 0.5) * 0.08;
  return [center[0] + dLat, center[1] + dLng];
}

function cityHiringUrl(name, where) {
  const q = encodeURIComponent(name);
  const w = encodeURIComponent(where);
  return `https://www.adzuna.com.mx/search?q=${q}&w=${w}`;
}

/**
 * Fetch live Adzuna postings for out-of-bound cities and shape them as
 * Company records. One probe per sector keeps the build within budget.
 */
async function fetchOutOfBoundCities() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn(
      "Warning: ADZUNA_APP_ID / ADZUNA_APP_KEY not set — skipping out-of-bound cities.",
    );
    return readJson(CITIES_OUT, []);
  }

  const deadline = Date.now() + CITIES_TIMEOUT_MS;
  const out = [];

  try {
    for (const city of OUT_OF_BOUND_CITIES) {
      const byCompany = new Map();

      for (const [category, keywords] of Object.entries(SECTOR_KEYWORDS)) {
        if (Date.now() >= deadline) {
          throw new Error("out-of-bound fetch exceeded overall time budget");
        }

        const keyword = keywords[0];
        let data;
        try {
          data = await fetchAdzunaPage(
            appId,
            appKey,
            1,
            keyword,
            city.where,
            AbortSignal.timeout(ADZUNA_REQUEST_TIMEOUT_MS),
          );
        } catch (err) {
          console.warn(
            `  ${city.name}/${keyword}: ${err instanceof Error ? err.message : err}`,
          );
          continue;
        }

        for (const job of data.results ?? []) {
          const displayName = job.company?.display_name?.trim();
          if (!displayName || shouldExcludeAdzunaEmployer(displayName)) continue;

          const key = normalizeName(displayName);
          let lat = job.location?.latitude ?? job.latitude ?? null;
          let lng = job.location?.longitude ?? job.longitude ?? null;
          if (
            lat == null ||
            lng == null ||
            !Number.isFinite(Number(lat)) ||
            !Number.isFinite(Number(lng))
          ) {
            [lat, lng] = jitterFromName(displayName, city.center);
          } else {
            lat = Number(lat);
            lng = Number(lng);
          }

          let entry = byCompany.get(key);
          if (!entry) {
            entry = {
              id: `${slug(city.name)}-${slug(displayName)}`,
              name: displayName,
              category,
              zone: city.name,
              city: city.name,
              lat,
              lng,
              openRoles: 0,
              lastPostedAt: "",
              hiringUrl: cityHiringUrl(displayName, city.where),
              isAgency: isStaffingAgency(displayName),
              source: ["adzuna"],
            };
            byCompany.set(key, entry);
          }

          entry.openRoles += 1;
          const created = job.created ?? "";
          if (created > entry.lastPostedAt) entry.lastPostedAt = created;
        }

        await sleep(ADZUNA_DELAY_MS);
      }

      const cityList = [...byCompany.values()].sort(
        (a, b) => b.openRoles - a.openRoles || a.name.localeCompare(b.name),
      );
      console.log(
        `  ${city.name}: ${cityList.length} employers (${cityList.reduce(
          (s, e) => s + e.openRoles,
          0,
        )} open roles)`,
      );
      out.push(...cityList);
    }

    const seen = new Set();
    for (const r of out) {
      let id = r.id;
      let n = 2;
      while (seen.has(id)) id = `${r.id}-${n++}`;
      seen.add(id);
      r.id = id;
    }

    return out;
  } catch (err) {
    console.warn(
      `Warning: out-of-bound fetch failed — ${err instanceof Error ? err.message : err}`,
    );
    console.warn(
      `  Continuing with existing ${path.relative(ROOT, CITIES_OUT)} or [].`,
    );
    return readJson(CITIES_OUT, []);
  }
}

function runMerge() {
  const r = spawnSync(process.execPath, [path.join(__dirname, "write-merged.mjs")], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

async function main() {
  console.log("build-data: parsing DENUE CSV…");
  const denue = parseDenueCsvGz();
  writeJson(DENUE_OUT, denue);
  console.log(`  → ${denue.length} Hermosillo establishments`);

  console.log("build-data: fetching Adzuna (Hermosillo)…");
  const adzuna = await fetchAdzuna();
  writeJson(ADZUNA_OUT, adzuna);
  console.log(`  → ${adzuna.length} employers with open roles`);

  console.log("build-data: fetching out-of-bound cities…");
  const cities = await fetchOutOfBoundCities();
  writeJson(CITIES_OUT, cities);
  console.log(`  → ${cities.length} out-of-town employers`);

  console.log("build-data: merging sources…");
  runMerge();
  console.log("build-data: done.");
}

main().catch((err) => {
  console.error("build-data failed:", err);
  process.exit(1);
});
