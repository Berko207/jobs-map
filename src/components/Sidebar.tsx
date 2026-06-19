"use client";

import { useMemo, useState } from "react";
import { Company, HOME_CITY, isHiring, sizeSortValue } from "@/data/companies";
import CompanyCard from "./CompanyCard";
import { CompanyStates } from "@/lib/storage";

export type SortOption = "hiring" | "rating" | "size" | "name";
export type ListView = "all" | "saved" | "applied";

interface SidebarProps {
  companies: Company[];
  companyStates: CompanyStates;
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;
  onToggleSaved: (id: string) => void;
  onToggleApplied: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  zone: string;
  onZoneChange: (value: string) => void;
  zones: string[];
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  listView: ListView;
  onListViewChange: (value: ListView) => void;
  city: string;
}

export default function Sidebar({
  companies,
  companyStates,
  selectedCompanyId,
  onSelectCompany,
  onToggleSaved,
  onToggleApplied,
  search,
  onSearchChange,
  zone,
  onZoneChange,
  zones,
  sort,
  onSortChange,
  listView,
  onListViewChange,
  city,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sorted = useMemo(() => {
    const list = [...companies];
    list.sort((a, b) => {
      const agency = (a.isAgency ? 1 : 0) - (b.isAgency ? 1 : 0);
      if (agency !== 0) return agency;
      switch (sort) {
        case "hiring": {
          const hiringDelta = (isHiring(b) ? 1 : 0) - (isHiring(a) ? 1 : 0);
          if (hiringDelta !== 0) return hiringDelta;
          const roles = (b.openRoles ?? 0) - (a.openRoles ?? 0);
          if (roles !== 0) return roles;
          return (b.googleRating ?? 0) - (a.googleRating ?? 0);
        }
        case "rating":
          return (b.googleRating ?? 0) - (a.googleRating ?? 0);
        case "size":
          return sizeSortValue(b.size) - sizeSortValue(a.size);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return list;
  }, [companies, sort]);

  const filteredByView = useMemo(() => {
    if (listView === "saved") {
      return sorted.filter((c) => companyStates[c.id]?.saved);
    }
    if (listView === "applied") {
      return sorted.filter((c) => companyStates[c.id]?.applied);
    }
    return sorted;
  }, [sorted, listView, companyStates]);

  const content = (
    <>
      <div className="space-y-2 border-b border-zinc-200 p-3">
        <label className="block">
          <span className="sr-only">Search employers</span>
          <input
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </label>
        <div className="flex gap-2">
          {zones.length > 1 && (
            <label className="flex-1">
              <span className="sr-only">Filter by zone</span>
              <select
                value={zone}
                onChange={(e) => onZoneChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">All zones</option>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={zones.length > 1 ? "" : "flex-1"}>
            <span className="sr-only">Sort by</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="hiring">Hiring first</option>
              <option value="rating">Rating</option>
              <option value="size">Size</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div
          className="flex rounded-lg border border-zinc-200 p-0.5"
          role="group"
          aria-label="List view"
        >
          {(
            [
              ["all", "All"],
              ["saved", "Saved"],
              ["applied", "Applied"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onListViewChange(value)}
              aria-pressed={listView === value}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                listView === value
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-xs text-zinc-500">
          {filteredByView.length} employer
          {filteredByView.length !== 1 ? "s" : ""}
        </p>
        {filteredByView.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No employers match
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Clear a filter or broaden your search.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredByView.map((company) => (
              <li key={company.id}>
                <CompanyCard
                  company={company}
                  saved={companyStates[company.id]?.saved ?? false}
                  applied={companyStates[company.id]?.applied ?? false}
                  onToggleSaved={() => onToggleSaved(company.id)}
                  onToggleApplied={() => onToggleApplied(company.id)}
                  onSelect={() => {
                    onSelectCompany(company.id);
                    setMobileOpen(false);
                  }}
                  isSelected={selectedCompanyId === company.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-96 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <header className="border-b border-zinc-200 px-3 py-3">
          <h1 className="text-lg font-bold text-zinc-900">
            Hermosillo Jobs Map
          </h1>
          <p className="text-xs text-zinc-500">
            {city === HOME_CITY
              ? "Filter by sector to find where to apply"
              : `Live job postings in ${city}`}
          </p>
        </header>
        {content}
      </aside>

      {/* Mobile bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[1000] md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-t-xl border border-b-0 border-zinc-200 bg-white px-4 py-3 shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          aria-expanded={mobileOpen}
        >
          <span className="font-semibold text-zinc-900">
            Employers ({filteredByView.length})
          </span>
          <span className="text-sm text-zinc-500" aria-hidden>
            {mobileOpen ? "▼" : "▲"}
          </span>
        </button>
        <div
          className={`flex flex-col overflow-hidden border border-zinc-200 bg-white transition-[max-height] duration-300 motion-reduce:transition-none ${
            mobileOpen ? "max-h-[70vh]" : "max-h-0"
          }`}
        >
          {content}
        </div>
      </div>
    </>
  );
}
