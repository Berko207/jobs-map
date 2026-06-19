# Hermosillo Jobs Map

A sector-filtered employer finder for Hermosillo, Sonora. Plot local companies on a free CARTO/OpenStreetMap basemap, filter by industry (call centers, software, manufacturing, robotics, etc.), and jump to job-board searches for each employer.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local dev uses the last committed `companies.merged.json`. Run `npm run build` to regenerate from the DENUE CSV and Adzuna (requires env vars for live hiring data).

## Deploy to Vercel

1. Push this repo to GitHub (includes `data/denue_sonora.csv.gz`).
2. Import at [vercel.com/new](https://vercel.com/new).
3. **Build Command:** `npm run build` (default — do not override).
4. Optional env vars (Project Settings → Environment Variables):
   - `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` — live "Hiring now" data from [developer.adzuna.com](https://developer.adzuna.com/). If missing or the API fails, the build continues with DENUE + curated only.

Every deploy runs `scripts/build-data.mjs` before `next build`: parses the committed DENUE gzip, fetches Adzuna (non-fatal), merges via `merge.ts` logic, writes `src/data/companies.merged.json`.

Map tiles use **CARTO Voyager** (free). Keep attribution visible: *© OpenStreetMap contributors © CARTO*.

## Features

- **Sector filter** — multi-select chips with live counts; filters map markers and sidebar list together.
- **Map** — colored `circleMarker` pins by sector, clustered when zoomed out.
- **Sidebar** — search, zone filter, sort (rating / size / name), ranked employer cards.
- **Find roles** — deep links to Indeed, Computrabajo, and Google job searches (no API).
- **Hiring now** — filter employers with active Adzuna postings; open-role counts link to Adzuna searches.
- **Save / Applied** — toggles persist in `localStorage` (default) or Supabase (optional).

## Data pipeline (build-time)

Employer data merges from three sources:

| Source | Input | Output |
|--------|-------|--------|
| Curated featured | `curatedFeatured.json` | hand-edited pins with ratings/notes |
| DENUE (INEGI) | `data/denue_sonora.csv.gz` | Hermosillo establishments by SCIAN sector |
| Adzuna jobs | Vercel env vars at build | active open-role counts |

```
data/denue_sonora.csv.gz  ─┐
Vercel ADZUNA_* env vars  ─┼─► scripts/build-data.mjs ─► companies.merged.json ─► app
curatedFeatured.json      ─┘
```

### Updating DENUE data

1. Download the Sonora CSV zip from [INEGI DENUE](https://www.inegi.org.mx/app/descarga/default.html?t=denue) (entidad 26).
2. Gzip the CSV inside `conjunto_de_datos/`:

   ```bash
   unzip -p denue_26_csv.zip conjunto_de_datos/denue_inegi_26_.csv | gzip -9 > data/denue_sonora.csv.gz
   ```

3. Commit `data/denue_sonora.csv.gz` (the raw `.csv` and `.zip` stay out of git).

## Adding employers

Edit `src/data/curatedFeatured.json` for hand-picked pins (also exported via `curatedFeatured.ts`).

### Extending sectors

1. Add the new label to the `Category` union type in `types.ts`.
2. Add a hex color to `CATEGORY_COLORS`.
3. Update SCIAN / keyword rules in `scripts/build-data.mjs` if DENUE should map to the new sector.

## Optional Supabase persistence

By default, Save/Applied state is stored in the browser via `localStorage`.

To sync across devices:

1. Create a free [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars.

If env vars are missing, the app silently falls back to `localStorage`.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- react-leaflet v4 + leaflet + react-leaflet-cluster
- CARTO Voyager tiles over OpenStreetMap data

## Project structure

```
src/
  app/           # layout, page (dynamic JobsMap import)
  components/    # JobsMap, SectorFilter, Sidebar, CompanyCard
  data/          # merge.ts, curatedFeatured, companies.merged.json, types
  lib/           # jobLinks, storage
scripts/         # build-data.mjs, merge-companies.mjs, write-merged.mjs
data/            # denue_sonora.csv.gz (committed gzip of INEGI Sonora export)
supabase/        # optional schema
```

## License

MIT — map data © OpenStreetMap contributors; tiles © CARTO.
