<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hermosillo Jobs Map — agent notes

Interactive employer map for Hermosillo, Sonora. Production: [jobs-map.vercel.app](https://jobs-map.vercel.app).

## Build and data

- `npm run build` runs `scripts/build-data.mjs` then `next build`.
- **Do not hand-edit** `companies.merged.json`, `companies.denue.json`, or `companies.adzuna.json` — regenerate via build.
- **Curated source of truth:** `src/data/curatedFeatured.json` (typed export in `curatedFeatured.ts`).
- Merge logic lives in `src/data/merge.ts` (app) and `scripts/merge-companies.mjs` (build); keep them in sync.
- DENUE input: committed `data/denue_sonora.csv.gz` (raw CSV is gitignored).
- Adzuna fetch is optional and non-fatal; requires `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` at build time.
- `nominatim-cache.json` supplies fallback coordinates during merge.

## UI conventions

- Map is client-only via dynamic import (`JobsMapLoader.tsx`).
- Categories and colors: `src/data/types.ts` → `Category`, `CATEGORY_COLORS`.
- Job search links: `src/lib/jobLinks.ts` (Indeed, Computrabajo, Google — no scraping).
- Save/Applied: `localStorage` by default; Supabase when `NEXT_PUBLIC_SUPABASE_*` env vars are set.

## Vercel deploys

- Git pushes trigger production builds when the commit author email matches the linked GitHub account.
- Manual Vercel redeploys bypass the GitHub email check.

## Scope

- Hermosillo-focused; DENUE filter is `municipio === "Hermosillo"`.
- Sector mapping rules are in `scripts/build-data.mjs` (`categorize`, `SECTOR_KEYWORDS`).
