"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import {
  CATEGORY_COLORS,
  Category,
  COMPANIES,
  Company,
  DEFAULT_ZOOM,
  HERMOSILLO_CENTER,
  sizeRadius,
} from "@/data/companies";
import {
  CompanyStates,
  loadCompanyStates,
  persistCompanyStates,
  syncStateToBackend,
} from "@/lib/storage";
import { jobLinks } from "@/lib/jobLinks";
import SectorFilter from "./SectorFilter";
import Sidebar, { ListView, SortOption } from "./Sidebar";

const CARTO_TILE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function FlyToCompany({
  company,
}: {
  company: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (company) {
      map.flyTo([company.lat, company.lng], 15, {
        duration: company ? 1 : 0,
      });
    }
  }, [company, map]);
  return null;
}

function PopupOpener({
  companyId,
  markerRefs,
}: {
  companyId: string | null;
  markerRefs: React.MutableRefObject<Map<string, L.CircleMarker>>;
}) {
  useEffect(() => {
    if (!companyId) return;
    const marker = markerRefs.current.get(companyId);
    if (marker) {
      marker.openPopup();
    }
  }, [companyId, markerRefs]);
  return null;
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
  const links = jobLinks(company.name);
  const color = CATEGORY_COLORS[company.category];

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
      <div className="mt-1 flex gap-2 text-xs text-zinc-600">
        {company.googleRating != null && (
          <span>★ {company.googleRating.toFixed(1)}</span>
        )}
        {company.size && <span>{company.size}</span>}
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
          href={links.google}
          target="_blank"
          rel="noopener noreferrer"
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
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [zone, setZone] = useState("");
  const [sort, setSort] = useState<SortOption>("rating");
  const [listView, setListView] = useState<ListView>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const [companyStates, setCompanyStates] = useState<CompanyStates>({});
  const [loaded, setLoaded] = useState(false);
  const markerRefs = useRef<Map<string, L.CircleMarker>>(new Map());

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

  const filteredCompanies = useMemo(() => {
    return COMPANIES.filter((c) => {
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.includes(c.category)
      ) {
        return false;
      }
      if (zone && c.zone !== zone) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      const state = companyStates[c.id];
      if (listView === "saved" && !state?.saved) return false;
      if (listView === "applied" && !state?.applied) return false;
      return true;
    });
  }, [selectedCategories, zone, search, listView, companyStates]);

  const selectedCompany = useMemo(
    () => COMPANIES.find((c) => c.id === selectedCompanyId) ?? null,
    [selectedCompanyId],
  );

  const flyTarget = selectedCompany
    ? { lat: selectedCompany.lat, lng: selectedCompany.lng }
    : null;

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
      />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          companies={filteredCompanies}
          companyStates={companyStates}
          selectedCompanyId={selectedCompanyId}
          onSelectCompany={setSelectedCompanyId}
          onToggleSaved={(id) => updateState(id, "saved")}
          onToggleApplied={(id) => updateState(id, "applied")}
          search={search}
          onSearchChange={setSearch}
          zone={zone}
          onZoneChange={setZone}
          sort={sort}
          onSortChange={setSort}
          listView={listView}
          onListViewChange={setListView}
        />
        <div className="relative flex-1 pb-12 md:pb-0">
          <MapContainer
            center={HERMOSILLO_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer url={CARTO_TILE} attribution={CARTO_ATTRIBUTION} />
            <FlyToCompany company={flyTarget} />
            <PopupOpener
              companyId={selectedCompanyId}
              markerRefs={markerRefs}
            />
            <MarkerClusterGroup chunkedLoading>
              {filteredCompanies.map((company) => {
                const color = CATEGORY_COLORS[company.category];
                const state = companyStates[company.id] ?? {
                  saved: false,
                  applied: false,
                };
                return (
                  <CircleMarker
                    key={company.id}
                    center={[company.lat, company.lng]}
                    radius={sizeRadius(company.size)}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.85,
                      color: "#fff",
                      weight: 2,
                    }}
                    ref={(ref) => {
                      if (ref) {
                        markerRefs.current.set(company.id, ref);
                      } else {
                        markerRefs.current.delete(company.id);
                      }
                    }}
                    eventHandlers={{
                      click: () => setSelectedCompanyId(company.id),
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
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
