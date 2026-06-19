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

const merged = mergeCompanies(
  readJson("companies.denue.json"),
  readJson("companies.adzuna.json"),
  readJson("nominatim-cache.json"),
);

fs.writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
console.log(`Merged ${merged.length} companies → ${OUT}`);
