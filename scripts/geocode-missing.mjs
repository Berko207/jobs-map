#!/usr/bin/env node
/**
 * Geocode employers missing coordinates via Nominatim (≤1 req/sec).
 * Updates src/data/nominatim-cache.json keyed by normalizeName().
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src/data");
const CACHE_PATH = path.join(DATA, "nominatim-cache.json");

const USER_AGENT = "HermosilloJobsMap/1.0 (jobs-map; geocode-missing script)";

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function geocode(query) {
  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=` +
    encodeURIComponent(query);
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

async function main() {
  const denue = readJson(path.join(DATA, "companies.denue.json"), []);
  const adzuna = readJson(path.join(DATA, "companies.adzuna.json"), []);
  const cache = readJson(CACHE_PATH, {});

  const needGeocode = new Map();

  for (const r of [...denue, ...adzuna]) {
    if (r.lat != null && r.lng != null) continue;
    const key = normalizeName(r.name);
    if (cache[key]) continue;
    if (!needGeocode.has(key)) {
      needGeocode.set(key, `${r.name} Hermosillo Sonora Mexico`);
    }
  }

  if (needGeocode.size === 0) {
    console.log("Geocode: nothing missing (cache covers all).");
    return;
  }

  console.log(`Geocoding ${needGeocode.size} employer(s) via Nominatim…`);
  let added = 0;

  for (const [key, query] of needGeocode) {
    try {
      const result = await geocode(query);
      if (result) {
        cache[key] = result;
        added++;
        console.log(`  ✓ ${key}`);
      } else {
        console.log(`  ✗ no result for ${key}`);
      }
    } catch (err) {
      console.warn(`  ✗ ${key}: ${err.message}`);
    }
    await sleep(1100);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
  console.log(`Updated cache: ${added} new entries → ${CACHE_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
