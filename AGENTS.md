<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Hermosillo Jobs Map

Employer map for Hermosillo, Sonora. Production: [jobs-map.vercel.app](https://jobs-map.vercel.app).

`CLAUDE.md` only imports this file. Edit rules here.

## Commands

- `npm run dev` — local app. Uses the committed `companies.merged.json`. Does not fetch Adzuna.
- `npm run build` — `scripts/build-data.mjs`, then `next build`. This is the Vercel build command. Do not override it.
- Both commands copy the MapLibre worker to `public/vendor/` first (`scripts/copy-maplibre-worker.mjs`). That directory is gitignored.

## Environment

- `.env.example` is the committed template.
- `.env.local` holds real values and is gitignored. Create it with `cp .env.example .env.local`.
- `scripts/build-data.mjs` loads env files through `@next/env` because it runs before Next. Shell and Vercel variables win over the files.
- `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are optional build-time keys. A missing key or a failed fetch must not fail the build.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are optional. Without them, Save / Applied stays in `localStorage`.
- Do not commit secrets. Do not add a map-tile API key. The basemap does not use one.

## Map

- Client-only. `JobsMapLoader.tsx` dynamic-imports `JobsMap.tsx` with `ssr: false`.
- Basemap is OpenFreeMap Liberty (`https://tiles.openfreemap.org/styles/liberty`) via `@maplibre/maplibre-gl-leaflet`, under the Leaflet markers.
- `MapContainer` must keep a finite `maxZoom`. Marker clustering throws `Map has no maxZoom specified` without one. The old CARTO tile layer used to supply it.
- No WebGL2: fall back to `tile.openstreetmap.org` raster tiles.
- Keep the attribution control.
- Markers are `CircleMarker`s inside `MarkerClusterGroup`, colored from `CATEGORY_COLORS` in `src/data/types.ts`.
- Known bug, leave it unless asked: clicking a spiderfied or clustered marker often opens no company popup. Many DENUE rows share one coordinate (hospital and plaza piles). Sidebar selection still opens the popup. Do not treat empty cluster clicks as missing company names.

## Data

- Do not hand-edit `companies.merged.json`, `companies.denue.json`, `companies.adzuna.json`, or `companies.cities.json`.
- Curated source of truth: `src/data/curatedFeatured.json`, re-exported by `curatedFeatured.ts`. Those coordinates win.
- Keep `src/data/merge.ts` and `scripts/merge-companies.mjs` in sync.
- DENUE input is the committed `data/denue_sonora.csv.gz`. The raw CSV is gitignored. The Hermosillo filter is `municipio === "Hermosillo"`.
- Sector rules live in `scripts/build-data.mjs` (`categorize`, `SECTOR_KEYWORDS`) and must match `Category` in `src/data/types.ts`.
- `nominatim-cache.json` is the fallback coordinate cache.
- Out-of-bound cities (Monterrey, Guadalajara, Tijuana, Ciudad de México, Querétaro) come from Adzuna only. Keep their centers aligned with `CITIES` in `types.ts`.

## UI

- Job links: `src/lib/jobLinks.ts`. Indeed, Computrabajo, and Google. No scraping.
- Search: `src/lib/search.ts`.
- Save / Applied: `src/lib/storage.ts`.

## Deploy

- GitHub `main` deploys to Vercel when the commit email is on the GitHub account.
- A dashboard redeploy does not check that email.
