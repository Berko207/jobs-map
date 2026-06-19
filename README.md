# Hermosillo Jobs Map

A sector-filtered employer finder for Hermosillo, Sonora. Plot local companies on a free CARTO/OpenStreetMap basemap, filter by industry (call centers, software, manufacturing, robotics, etc.), and jump to job-board searches for each employer.

**No API keys required.** Runs entirely from committed seed data with optional Supabase for cloud persistence.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Deploy — no environment variables needed for the default experience.

Map tiles use **CARTO Voyager** (free). You must keep attribution visible: *© OpenStreetMap contributors © CARTO*.

## Features

- **Sector filter** — multi-select chips with live counts; filters map markers and sidebar list together.
- **Map** — colored `circleMarker` pins by sector, clustered when zoomed out.
- **Sidebar** — search, zone filter, sort (rating / size / name), ranked employer cards.
- **Find roles** — deep links to Indeed, Computrabajo, and Google job searches (no API).
- **Save / Applied** — toggles persist in `localStorage` (default) or Supabase (optional).

## Adding employers

Edit `src/data/companies.ts`:

1. Add a `Company` object with a unique `id`, `name`, `category`, `zone`, `lat`, `lng`, and optional fields.
2. Pick an existing `Category` or extend the type and add a color to `CATEGORY_COLORS`.

### Geocoding with Nominatim (free)

To get coordinates for a new address:

```bash
curl -A "HermosilloJobsMap/1.0 (your@email.com)" \
  "https://nominatim.openstreetmap.org/search?q=YOUR+ADDRESS+Hermosillo+Sonora&format=json&limit=1"
```

**Rules:** max 1 request/second, include a descriptive `User-Agent` with contact info, and cache results in the seed file (don't geocode at runtime).

### Extending sectors

1. Add the new label to the `Category` union type.
2. Add a hex color to `CATEGORY_COLORS`.
3. The sector filter, map markers, and legend pick it up automatically.

## Optional Supabase persistence

By default, Save/Applied state is stored in the browser via `localStorage`.

To sync across devices:

1. Create a free [Supabase](https://supabase.com) project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` → `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Restart the dev server.

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
  data/          # companies seed + category colors
  lib/           # jobLinks, storage
supabase/        # optional schema
```

## License

MIT — map data © OpenStreetMap contributors; tiles © CARTO.
