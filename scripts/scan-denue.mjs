#!/usr/bin/env node
/**
 * DENUE scanner stub — writes src/data/companies.denue.json
 * Exits 0 when INEGI token is missing so CI/builds pass.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "src/data/companies.denue.json");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = { ...process.env, ...loadEnvLocal() };
const token = env.INEGI_DENUE_TOKEN;

if (!token) {
  console.log(
    "DENUE scan skipped: INEGI_DENUE_TOKEN not set in .env.local.",
  );
  console.log(
    "See INEGI DENUE API docs at https://www.inegi.org.mx/servicios/api_denue.html",
  );
  if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, "[]\n");
  process.exit(0);
}

// Placeholder for full DENUE integration — keep existing file if present
console.log(
  "DENUE token found but full scanner not yet implemented; keeping existing companies.denue.json.",
);
if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, "[]\n");
