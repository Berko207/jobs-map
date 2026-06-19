#!/usr/bin/env node
/**
 * DENUE (INEGI) scanner for Hermosillo employers.
 * Writes src/data/companies.denue.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src/data/companies.denue.json");

const LAT = 29.0892;
const LNG = -110.9613;
/** API max is 5000 m; use grid of centers to approximate 14 km coverage. */
const RADIUS_M = 5000;
const DELAY_MS = 250;

const SECTOR_KEYWORDS = {
  "Call Center / BPO": [
    "call center",
    "centro de atencion telefonica",
    "bpo",
  ],
  Software: [
    "software",
    "desarrollo de software",
    "tecnologias de la informacion",
  ],
  "Telemetry / IoT": ["telemetria", "rastreo gps", "monitoreo vehicular"],
  "Robotics / Automation": [
    "automatizacion",
    "robotica",
    "control industrial",
  ],
  "Manufacturing / Automotive": [
    "manufactura",
    "autopartes",
    "arneses",
    "metalmecanica",
  ],
  Media: ["periodico", "medios de comunicacion", "radiodifusion"],
  Mobility: ["transporte de pasajeros", "movilidad"],
};

/** Offset centers (~7 km) so overlapping 5 km circles cover Hermosillo metro. */
const SEARCH_CENTERS = [
  [LAT, LNG],
  [LAT + 0.045, LNG],
  [LAT - 0.045, LNG],
  [LAT, LNG + 0.045],
  [LAT, LNG - 0.045],
];

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = val;
  }
  return env;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** DENUE expects comma-separated words in the URL path segment. */
function denueKeyword(keyword) {
  return encodeURIComponent(keyword.trim().replace(/\s+/g, ","));
}

function mapEstratoToSize(strata) {
  const n = Number(strata);
  switch (n) {
    case 1:
    case 2:
      return "1–10";
    case 3:
    case 4:
      return "11–50";
    case 5:
      return "51–200";
    case 6:
      return "201–500";
    case 7:
      return "500+";
    default:
      return undefined;
  }
}

function parseRow(row, category) {
  if (!Array.isArray(row) || row.length < 19) return null;

  const id = String(row[1] ?? "").trim();
  const name = String(row[2] ?? row[3] ?? "").trim();
  const activity = String(row[4] ?? "").trim();
  const sizeStrata = row[5];
  const colonia = String(row[10] ?? "").trim();
  const website = String(row[15] ?? "").trim() || undefined;
  const lng = parseFloat(row[17]);
  const lat = parseFloat(row[18]);

  if (!id || !name || Number.isNaN(lat) || Number.isNaN(lng)) return null;

  return {
    id,
    name,
    activity,
    sizeStrata: sizeStrata != null ? Number(sizeStrata) : undefined,
    size: mapEstratoToSize(sizeStrata),
    website,
    lat,
    lng,
    category,
    zone: colonia || "Hermosillo",
  };
}

async function fetchDenue(token, keyword, lat, lng) {
  const url =
    `https://www.inegi.org.mx/app/api/denue/v1/consulta/Buscar/` +
    `${denueKeyword(keyword)}/${lat},${lng}/${RADIUS_M}/${token}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`DENUE HTTP ${res.status} for "${keyword}" @ ${lat},${lng}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() };
  const token = env.DENUE_TOKEN;

  if (!token) {
    console.log(
      "DENUE scan skipped: DENUE_TOKEN not set in .env.local.",
    );
    console.log(
      "Register for a free token at https://www.inegi.org.mx/servicios/api_denue.html",
    );
    if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, "[]\n");
    process.exit(0);
  }

  /** @type {Map<string, object>} */
  const byId = new Map();

  for (const [category, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    for (const keyword of keywords) {
      for (const [clat, clng] of SEARCH_CENTERS) {
        let rows;
        try {
          rows = await fetchDenue(token, keyword, clat, clng);
        } catch (err) {
          console.warn(`Warning: ${err.message}`);
          await sleep(DELAY_MS);
          continue;
        }

        for (const row of rows) {
          const rec = parseRow(row, category);
          if (!rec) continue;
          if (!byId.has(rec.id)) byId.set(rec.id, rec);
        }

        await sleep(DELAY_MS);
      }
    }
  }

  const output = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Wrote ${output.length} DENUE establishments → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
