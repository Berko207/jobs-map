"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import {
  CATEGORY_COLORS,
  Category,
  cityConfig,
  COMPANIES,
  Company,
  DEFAULT_ZOOM,
  HERMOSILLO_CENTER,
  HOME_CITY,
  isHiring,
  sizeRadius,
} from "@/data/companies";
import {
  CompanyStates,
  loadCompanyStates,
  persistCompanyStates,
  syncStateToBackend,
} from "@/lib/storage";
import { googleMapsUrl, jobLinks } from "@/lib/jobLinks";
import { matchesCompanySearch } from "@/lib/search";
import SectorFilter from "./SectorFilter";
import Sidebar, { ListView, SortOption } from "./Sidebar";

const CARTO_TILE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function FlyToCompany({
  target,
}: {
  target: { lat: number; lng: number; token: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 15, { duration: 1 });
  }, [target, map]);
  return null;
}

function RecenterOnCity({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

function SelectedCompanyPopup({
  company,
  saved,
  applied,
  onToggleSaved,
  onToggleApplied,
}: {
  company: Company;
  saved: boolean;
  applied: boolean;
  onToggleSaved: () => void;
  onToggleApplied: () => void;
}) {
  return (
    <Popup position={[company.lat, company.lng]}>
      <MapPopupContent
        company={company}
        saved={saved}
        applied={applied}
        onToggleSaved={onToggleSaved}
        onToggleApplied={onToggleApplied}
      />
    </Popup>
  );
}

function MapPopupContent({
  company,
  saved,
  applied,
  onToggleSaved,
  onToggleApplied,
}: {
  company: Company;
  saved: boolean;
  applied: boolean;
  onToggleSaved: () => void;
  onToggleApplied: () => void;
}) {
  const links = jobLinks(company.name, company.city ?? HOME_CITY);
  const color = CATEGORY_COLORS[company.category];
  const hiring = isHiring(company);

  return (
    <div className="min-w-[200px] max-w-[260px]">
      <h3 className="font-semibold text-zinc-900">{company.name}</h3>
      <span
        className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {company.category}
      </span>
      <p className="mt-1 text-xs text-zinc-500">{company.zone}</p>
      <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-600">
        {company.googleRating != null && (
          <span>★ {company.googleRating.toFixed(1)}</span>
        )}
        {company.size && <span>{company.size}</span>}
        {hiring && company.hiringUrl && (
          <a
            href={company.hiringUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-700 hover:underline"
          >
            {company.openRoles} open role{company.openRoles !== 1 ? "s" : ""}
          </a>
        )}
      </div>
      {company.note && (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
          {company.note}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-medium"
          >
            Website
          </a>
        )}
        <a
          href={links.indeed}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white"
        >
          Indeed
        </a>
        <a
          href={links.computrabajo}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white"
        >
          Computrabajo
        </a>
        <a
          href={googleMapsUrl(company.lat, company.lng, company.name)}
          target="_blank"
          rel="noopener noreferrer"
          title="Open pin in Google Maps"
          className="rounded border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700"
        >
          Maps
        </a>
        <a
          href={links.google}
          target="_blank"
          rel="noopener noreferrer"
          title="Search jobs on Google"
          className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-medium"
        >
          Google
        </a>
      </div>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={onToggleSaved}
          className={`rounded px-2 py-0.5 text-[10px] font-medium ${
            saved ? "bg-amber-100 text-amber-800" : "border border-zinc-200"
          }`}
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
        <button
          type="button"
          onClick={onToggleApplied}
          className={`rounded px-2 py-0.5 text-[10px] font-medium ${
            applied ? "bg-violet-100 text-violet-800" : "border border-zinc-200"
          }`}
        >
          {applied ? "Applied ✓" : "Applied"}
        </button>
      </div>
    </div>
  );
}

export default function JobsMap() {
  const [city, setCity] = useState<string>(HOME_CITY);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [sort, setSort] = useState<SortOption>("hiring");
  const [listView, setListView] = useState<ListView>("all");
  const [hiringNow, setHiringNow] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  // Bumped on every selection so the popup re-mounts (and thus re-opens) even
  // when the same company is picked again after its popup was closed.
  const [openToken, setOpenToken] = useState(0);
  // Only set when a selection should recenter the map (sidebar clicks), so
  // clicking a marker that is already visible doesn't yank the viewport.
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
    token: number;
  } | null>(null);
  const [companyStates, setCompanyStates] = useState<CompanyStates>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadCompanyStates().then((states) => {
      setCompanyStates(states);
      setLoaded(true);
    });
  }, []);

  const updateState = useCallback(
    (companyId: string, field: "saved" | "applied") => {
      setCompanyStates((prev) => {
        const current = prev[companyId] ?? { saved: false, applied: false };
        const next = {
          ...prev,
          [companyId]: {
            ...current,
            [field]: !current[field],
          },
        };
        persistCompanyStates(next);
        const updated = next[companyId];
        syncStateToBackend(companyId, updated.saved, updated.applied);
        return next;
      });
    },
    [],
  );

  const selectCompany = useCallback((companyId: string, recenter: boolean) => {
    setSelectedCompanyId(companyId);
    if (recenter) {
      setOpenToken((t) => t + 1);
      const company = COMPANIES.find((c) => c.id === companyId);
      if (company) {
        setFlyTarget({ lat: company.lat, lng: company.lng, token: Date.now() });
      }
    } else {
      setOpenToken(0);
    }
  }, []);

  const cityCompanies = useMemo(
    () => COMPANIES.filter((c) => (c.city ?? HOME_CITY) === city),
    [city],
  );

  const cityZones = useMemo(
    () => [...new Set(cityCompanies.map((c) => c.zone))].sort(),
    [cityCompanies],
  );

  const filteredCompanies = useMemo(() => {
    return cityCompanies.filter((c) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(c.category)
      ) {
        return false;
      }
      if (zone && c.zone !== zone) return false;
      if (!matchesCompanySearch(c, search)) return false;
      const state = companyStates[c.id];
      if (listView === "saved" && !state?.saved) return false;
      if (listView === "applied" && !state?.applied) return false;
      if (hiringNow && !isHiring(c)) return false;
      return true;
    });
  }, [
    cityCompanies,
    selectedCategories,
    zone,
    search,
    listView,
    companyStates,
    hiringNow,
  ]);

  const sectorFilterCompanies = useMemo(() => {
    return cityCompanies.filter((c) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(c.category)
      ) {
        return false;
      }
      if (zone && c.zone !== zone) return false;
      if (!matchesCompanySearch(c, search)) return false;
      const state = companyStates[c.id];
      if (listView === "saved" && !state?.saved) return false;
      if (listView === "applied" && !state?.applied) return false;
      return true;
    });
  }, [cityCompanies, selectedCategories, zone, search, listView, companyStates]);

  const handleCityChange = useCallback((next: string) => {
    setCity(next);
    setZone("");
    setSelectedCompanyId(null);
  }, []);

  const activeCity = cityConfig(city);

  const selectedCompany = useMemo(
    () => COMPANIES.find((c) => c.id === selectedCompanyId) ?? null,
    [selectedCompanyId],
  );

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <SectorFilter
        selected={selectedCategories}
        onChange={setSelectedCategories}
        companies={sectorFilterCompanies}
        hiringNow={hiringNow}
        onHiringNowChange={setHiringNow}
        city={city}
        onCityChange={handleCityChange}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          companies={filteredCompanies}
          companyStates={companyStates}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={(id) => selectCompany(id, true)}
          onToggleSaved={(id) => updateState(id, "saved")}
          onToggleApplied={(id) => updateState(id, "applied")}
          search={search}
          onSearchChange={setSearch}
          zone={zone}
          onZoneChange={setZone}
          zones={cityZones}
          sort={sort}
          onSortChange={setSort}
          listView={listView}
          onListViewChange={setListView}
          city={city}
        />
        <div className="relative flex-1 pb-12 md:pb-0">
          <MapContainer
            center={HERMOSILLO_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer url={CARTO_TILE} attribution={CARTO_ATTRIBUTION} />
            <RecenterOnCity center={activeCity.center} zoom={activeCity.zoom} />
            <FlyToCompany target={flyTarget} />
            {selectedCompany && openToken > 0 && (
              <SelectedCompanyPopup
                key={openToken}
                company={selectedCompany}
                saved={companyStates[selectedCompany.id]?.saved ?? false}
                applied={companyStates[selectedCompany.id]?.applied ?? false}
                onToggleSaved={() => updateState(selectedCompany.id, "saved")}
                onToggleApplied={() =>
                  updateState(selectedCompany.id, "applied")
                }
              />
            )}
            <MarkerClusterGroup chunkedLoading>
              {filteredCompanies.map((company) => {
                const color = CATEGORY_COLORS[company.category];
                const hiring = isHiring(company);
                const state = companyStates[company.id] ?? {
                  saved: false,
                  applied: false,
                };
                const radius = sizeRadius(company.size, hiring);
                return (
                  <Fragment key={company.id}>
                    {hiring && (
                      <CircleMarker
                        center={[company.lat, company.lng]}
                        radius={radius + 4}
                        pathOptions={{
                          fillOpacity: 0,
                          color: "#10b981",
                          weight: 3,
                          opacity: 0.85,
                        }}
                        eventHandlers={{
                          click: () => selectCompany(company.id, false),
                        }}
                      />
                    )}
                    <CircleMarker
                      center={[company.lat, company.lng]}
                      radius={radius}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.85,
                        color: hiring ? "#10b981" : "#fff",
                        weight: hiring ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => selectCompany(company.id, false),
                      }}
                    >
                      <Popup>
                        <MapPopupContent
                          company={company}
                          saved={state.saved}
                          applied={state.applied}
                          onToggleSaved={() => updateState(company.id, "saved")}
                          onToggleApplied={() =>
                            updateState(company.id, "applied")
                          }
                        />
                      </Popup>
                    </CircleMarker>
                  </Fragment>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
