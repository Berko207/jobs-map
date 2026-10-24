# Hermosillo Jobs Map

**Live:** [jobs-map.vercel.app](https://jobs-map.vercel.app)

Employer map for Hermosillo, Sonora. Filter companies by sector, see who is hiring, and open a job-board search for each one.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev` serves the last committed `src/data/companies.merged.json`. It does not call Adzuna. Run `npm run build` when you want a fresh merge from DENUE and Adzuna.

## Environment

Two files, two jobs:

| File | Committed | What it is |
|------|-----------|------------|
| `.env.example` | yes | Template. Names only, no secrets. |
| `.env.local` | no | Your real values. Already gitignored. |

Copy from the example if `.env.local` is missing: `cp .env.example .env.local`.

| Variable | Required | Used for |
|----------|----------|----------|
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | no | Live "Hiring now" counts at build time. From [developer.adzuna.com](https://developer.adzuna.com/). |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Save / Applied sync across devices. |

On Vercel, set the same names in Project Settings → Environment Variables. A missing Adzuna key or a failed fetch does not fail the build. A missing Supabase key keeps Save / Applied in `localStorage`.

The map does not use an API key.

## Map

Streets come from [OpenFreeMap](https://openfreemap.org/) (Liberty style, OpenStreetMap data), drawn with MapLibre under the Leaflet markers. No key, no request cap, commercial use allowed.

`npm run dev` and `npm run build` copy the MapLibre worker into `public/vendor/` before the app starts. That folder is generated. Do not commit it.

Browsers without WebGL2 fall back to OpenStreetMap raster tiles. Leave the attribution on the map: OpenFreeMap, OpenMapTiles, OpenStreetMap.

## Data

The app reads `src/data/companies.merged.json`. That file is a build artifact. So are `companies.denue.json` and `companies.adzuna.json`. Do not edit them by hand.

| Input | File | Role |
|-------|------|------|
| Curated pins | `src/data/curatedFeatured.json` | Hand-edited employers. These coordinates win. |
| DENUE | `data/denue_sonora.csv.gz` | INEGI establishments in Hermosillo. |
| Adzuna | env vars at build | Open-role counts. |
| Nominatim cache | `src/data/nominatim-cache.json` | Fallback coordinates. |

```
data/denue_sonora.csv.gz ─┐
.env.local ADZUNA_*      ─┼─► scripts/build-data.mjs ─► companies.merged.json
curatedFeatured.json     ─┤
nominatim-cache.json     ─┘
```

`src/data/merge.ts` is the merge used by the app. `scripts/merge-companies.mjs` is the copy used at build time. Change both together.

### Update DENUE

1. Download the Sonora export from [INEGI DENUE](https://www.inegi.org.mx/app/descarga/default.html?t=denue) (entidad 26).
2. Replace the gzip:

   ```bash
   unzip -p denue_26_csv.zip conjunto_de_datos/denue_inegi_26_.csv | gzip -9 > data/denue_sonora.csv.gz
   ```

3. Commit `data/denue_sonora.csv.gz`. The raw `.csv` and the zip stay out of git.

### Add an employer or a sector

Hand-picked pins go in `src/data/curatedFeatured.json`.

For a new sector: add the label to `Category` and a color to `CATEGORY_COLORS` in `src/data/types.ts`, then update the SCIAN and keyword rules in `scripts/build-data.mjs` if DENUE should map into it.

## Save / Applied

The browser stores toggles in `localStorage`. To sync across devices, create a Supabase project, run `supabase/schema.sql` in the SQL editor, and set the two `NEXT_PUBLIC_SUPABASE_*` variables.

## Deploy

The repo is already on Vercel via GitHub. Production builds use `npm run build`: data script, then `next build`. Do not override the build command.

Vercel skips a Git deploy when the commit email is not on the GitHub account. Add the email under [GitHub → Settings → Emails](https://github.com/settings/emails), or commit with an email that is already verified. A redeploy from the Vercel dashboard is not affected.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS, Leaflet, react-leaflet-cluster, MapLibre GL.

```
src/app/            layout and page
src/components/     JobsMap, filters, sidebar, cards
src/data/           types, curated pins, merge, generated JSON
src/lib/            job links, search, storage
scripts/            DENUE parse, Adzuna fetch, merge, MapLibre worker copy
data/               denue_sonora.csv.gz
supabase/           optional schema
```

## License

MIT. Map data © OpenStreetMap contributors. Tiles via OpenFreeMap © OpenMapTiles.
