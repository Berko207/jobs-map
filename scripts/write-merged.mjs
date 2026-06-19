#!/usr/bin/env node
/**
 * Merge freshly written source JSON → companies.merged.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeCompanies } from "./merge-companies.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "../src/data");
const OUT = path.join(DATA, "companies.merged.json");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

function readJsonSafe(name, fallback) {
  try {
    return readJson(name);
  } catch {
    return fallback;
  }
}

const HOME_CITY = "Hermosillo";

const home = mergeCompanies(
  readJson("companies.denue.json"),
  readJson("companies.adzuna.json"),
  readJson("nominatim-cache.json"),
).map((c) => ({ ...c, city: c.city ?? HOME_CITY }));

const outOfBound = readJsonSafe("companies.cities.json", []);
const merged = [...home, ...outOfBound];

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
console.log(
  `Merged ${home.length} ${HOME_CITY} + ${outOfBound.length} out-of-town = ${merged.length} companies → ${OUT}`,
);
