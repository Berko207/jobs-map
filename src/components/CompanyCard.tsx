"use client";

import { CATEGORY_COLORS, Company, isHiring } from "@/data/companies";
import { googleMapsUrl, jobLinks } from "@/lib/jobLinks";

interface CompanyCardProps {
  company: Company;
  saved: boolean;
  applied: boolean;
  onToggleSaved: () => void;
  onToggleApplied: () => void;
  onSelect: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export default function CompanyCard({
  company,
  saved,
  applied,
  onToggleSaved,
  onToggleApplied,
  onSelect,
  isSelected,
  compact,
}: CompanyCardProps) {
  const links = jobLinks(company.name, company.city ?? "Hermosillo");
  const color = CATEGORY_COLORS[company.category];
  const hiring = isHiring(company);

  return (
    <article
      className={`rounded-lg border p-3 transition-colors motion-reduce:transition-none ${
        isSelected
          ? "border-sky-400 bg-sky-50/80 ring-1 ring-sky-300"
          : company.isAgency
            ? "border-zinc-100 bg-zinc-50/80 opacity-90"
            : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-zinc-900">{company.name}</h3>
          {company.googleRating != null && (
            <span className="shrink-0 text-sm text-amber-600">
              ★ {company.googleRating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {company.category}
          </span>
          {company.size && (
            <span className="text-[10px] text-zinc-500">{company.size}</span>
          )}
          <span className="text-[10px] text-zinc-400">{company.zone}</span>
          {hiring && company.hiringUrl && (
            <a
              href={company.hiringUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              {company.openRoles} open role{company.openRoles !== 1 ? "s" : ""}
            </a>
          )}
          {company.isAgency && (
            <span className="text-[10px] text-zinc-400">Staffing agency</span>
          )}
        </div>
        {!compact && company.note && (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
            {company.note}
          </p>
        )}
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Website
          </a>
        )}
        <a
          href={links.indeed}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-sky-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Indeed
        </a>
        <a
          href={links.computrabajo}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Computrabajo
        </a>
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          title="Search LinkedIn"
          className="rounded bg-[#0A66C2] px-2 py-0.5 text-[10px] font-medium text-white hover:bg-[#004182] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          LinkedIn
        </a>
        <a
          href={googleMapsUrl(company.lat, company.lng, company.name)}
          target="_blank"
          rel="noopener noreferrer"
          title="Open pin in Google Maps"
          className="rounded border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Maps
        </a>
        <a
          href={links.google}
          target="_blank"
          rel="noopener noreferrer"
          title="Search jobs on Google"
          className="rounded border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Google
        </a>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={onToggleSaved}
            aria-pressed={saved}
            className={`rounded px-2 py-0.5 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
              saved
                ? "bg-amber-100 text-amber-800"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
          <button
            type="button"
            onClick={onToggleApplied}
            aria-pressed={applied}
            className={`rounded px-2 py-0.5 text-[10px] font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
              applied
                ? "bg-violet-100 text-violet-800"
                : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {applied ? "Applied ✓" : "Applied"}
          </button>
        </div>
      </div>
    </article>
  );
}
