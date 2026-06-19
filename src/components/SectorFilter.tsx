"use client";

import {
  ALL_CATEGORIES,
  CATEGORY_COLORS,
  Category,
  Company,
  countHiring,
  isHiring,
} from "@/data/companies";

interface SectorFilterProps {
  selected: Category[];
  onChange: (categories: Category[]) => void;
  companies: Company[];
  hiringNow: boolean;
  onHiringNowChange: (value: boolean) => void;
}

export default function SectorFilter({
  selected,
  onChange,
  companies,
  hiringNow,
  onHiringNowChange,
}: SectorFilterProps) {
  const counts = ALL_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = companies.filter((c) => c.category === cat).length;
      return acc;
    },
    {} as Record<Category, number>,
  );

  const hiringCount = countHiring(companies);

  const toggle = (cat: Category) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  const selectAll = () => onChange([]);
  const clearAll = () => onChange([]);

  const allSelected = selected.length === 0;

  return (
    <div className="border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Sector
        </span>
        <button
          type="button"
          onClick={selectAll}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
            allSelected
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
          aria-pressed={allSelected}
        >
          All
        </button>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => onHiringNowChange(!hiringNow)}
          aria-pressed={hiringNow}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
            hiringNow
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${hiringNow ? "bg-white" : "bg-emerald-500"}`}
            aria-hidden
          />
          Hiring now
          <span className="tabular-nums opacity-80">{hiringCount}</span>
        </button>
        <div className="hidden h-4 w-px bg-zinc-200 sm:block" />
        <div className="flex flex-1 flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => {
            const isActive =
              selected.length === 0 || selected.includes(cat);
            const dimmed = selected.length > 0 && !selected.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 motion-reduce:transition-none ${
                  isActive && selected.includes(cat)
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : dimmed
                      ? "border-zinc-200 bg-white text-zinc-400"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
                aria-pressed={selected.includes(cat)}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  aria-hidden
                />
                <span className="max-w-[9rem] truncate sm:max-w-none">
                  {cat}
                </span>
                <span
                  className={`tabular-nums ${dimmed ? "text-zinc-300" : "text-zinc-500"}`}
                >
                  {counts[cat]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <details className="group border-t border-zinc-100 px-3 py-1.5 sm:hidden">
        <summary className="cursor-pointer text-xs text-zinc-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
          Color legend
        </summary>
        <LegendGrid />
      </details>
    </div>
  );
}

function LegendGrid() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 py-1">
      {ALL_CATEGORIES.map((cat) => (
        <span
          key={cat}
          className="inline-flex items-center gap-1 text-[10px] text-zinc-500"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            aria-hidden
          />
          {cat}
        </span>
      ))}
      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
        <span className="h-2 w-2 rounded-full ring-2 ring-emerald-500 ring-offset-1" />
        Hiring now
      </span>
    </div>
  );
}

export { isHiring };
