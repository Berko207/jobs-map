#!/usr/bin/env node
/**
 * Adzuna "who's hiring" scanner for Hermosillo employers.
 * Writes src/data/companies.adzuna.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src/data/companies.adzuna.json");

const SECTOR_KEYWORDS = {
  "Call Center / BPO": ["call center", "centro de contacto", "bilingual"],
  Software: ["software", "desarrollador", "developer"],
  "Telemetry / IoT": ["telemetria", "iot", "gps"],
  "Robotics / Automation": ["automatizacion", "robotics", "controls"],
  "Manufacturing / Automotive": ["manufactura", "produccion", "automotriz"],
  Media: ["medios", "periodista", "contenido"],
  Mobility: ["logistica", "transporte"],
};

const AGENCY_TERMS = [
  "reclutamiento",
  "capital humano",
  "staffing",
  "manpower",
  "page",
  "adecco",
  "kelly",
  "randstad",
];

const MAX_PAGES = 3;
const DELAY_MS = 300;

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
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

function isAgency(name) {
  const lower = name.toLowerCase();
  return AGENCY_TERMS.some((t) => lower.includes(t));
}

function adzunaHiringUrl(companyName) {
  const q = encodeURIComponent(companyName);
  return `https://www.adzuna.com.mx/search?q=${q}&w=Hermosillo%2C%20Sonora`;
}

function normalizeName(name) {
  return name
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

async function fetchPage(appId, appKey, page, keyword) {
  const url =
    `https://api.adzuna.com/v1/api/jobs/mx/search/${page}` +
    `?app_id=${encodeURIComponent(appId)}` +
    `&app_key=${encodeURIComponent(appKey)}` +
    `&results_per_page=50` +
    `&where=Hermosillo` +
    `&what=${encodeURIComponent(keyword)}` +
    `&content-type=application/json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Adzuna HTTP ${res.status} for keyword "${keyword}" page ${page}`);
  }
  return res.json();
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() };
  const appId = env.ADZUNA_APP_ID;
  const appKey = env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.log(
      "Adzuna scan skipped: ADZUNA_APP_ID and ADZUNA_APP_KEY not set in .env.local.",
    );
    console.log(
      "Get free API keys at https://developer.adzuna.com/ (sign up → create app → copy App ID & App Key).",
    );
    if (!fs.existsSync(OUT)) {
      fs.writeFileSync(OUT, "[]\n");
    }
    process.exit(0);
  }

  /** @type {Map<string, object>} */
  const byCompany = new Map();

  for (const [category, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const keyword of keywords) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        let data;
        try {
          data = await fetchPage(appId, appKey, page, keyword);
        } catch (err) {
          console.warn(`Warning: ${err.message}`);
          break;
        }

        const results = data.results ?? [];
        if (results.length === 0) break;

        for (const job of results) {
          if (!isHermosilloArea(job.location)) continue;

          const displayName = job.company?.display_name?.trim();
          if (!displayName) continue;

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
              isAgency: isAgency(displayName),
            };
            byCompany.set(key, entry);
          }

          entry.openRoles += 1;
          if (created > entry.lastPostedAt) entry.lastPostedAt = created;
          if (entry.lat == null && lat != null) entry.lat = Number(lat);
          if (entry.lng == null && lng != null) entry.lng = Number(lng);
        }

        if (results.length < 50) break;
        await sleep(DELAY_MS);
      }
      await sleep(DELAY_MS);
    }
  }

  const output = [...byCompany.values()].sort(
    (a, b) => b.openRoles - a.openRoles || a.name.localeCompare(b.name),
  );

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n");
  console.log(
    `Wrote ${output.length} Adzuna employers (${output.reduce((s, e) => s + e.openRoles, 0)} open roles) → ${OUT}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
