"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useLayoutEffect, useState, type MouseEvent } from "react";

export type FilterOption = { id: string; label: string; count: number };

type BarProps = {
  options: FilterOption[];
  /** The chosen filter id, or null before hydration (the CSS marks the active link from <html>). */
  current: string | null;
  onChoose?: (e: MouseEvent<HTMLAnchorElement>, id: string) => void;
};

const hrefOf = (id: string) => (id === "all" ? "/work" : `/work?d=${id}`);

/** Sets or clears <html data-work-filter>, which the CSS uses to hide rows and mark the active link. */
function applyFilter(id: string) {
  const root = document.documentElement;
  if (id === "all") root.removeAttribute("data-work-filter");
  else root.setAttribute("data-work-filter", id);
}

/** The filter links. Real links (/work?d=video), so they work without JS; counts are hidden from the name. */
function FilterBar({ options, current, onChoose }: BarProps) {
  return (
    <ul className="flex flex-wrap gap-2">
      {options.map((o) => (
        <li key={o.id}>
          <a
            href={hrefOf(o.id)}
            data-filter={o.id}
            aria-current={current === o.id ? "true" : undefined}
            onClick={onChoose ? (e) => onChoose(e, o.id) : undefined}
            className="work-filter-link label-mono"
          >
            {o.label}
            <span aria-hidden="true" className="work-filter-count">
              {o.count}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function LiveFilter({ options }: { options: FilterOption[] }) {
  const params = useSearchParams();
  const d = params.get("d");
  const filter = d && options.some((o) => o.id === d) ? d : "all";
  const [announce, setAnnounce] = useState(false);

  // Keep <html data-work-filter> in step with the URL (also after soft navigations); clear it on leave.
  useLayoutEffect(() => {
    applyFilter(filter);
  }, [filter]);
  useLayoutEffect(() => () => applyFilter("all"), []);

  const choose = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab/window: let it through
    e.preventDefault();
    applyFilter(id);
    // replaceState is integrated with the Next.js router, so useSearchParams() follows it.
    window.history.replaceState(null, "", hrefOf(id));
    setAnnounce(true);
  };

  const chosen = options.find((o) => o.id === filter) ?? options[0];
  const message =
    announce && chosen
      ? `Showing ${chosen.count} ${chosen.count === 1 ? "project" : "projects"}${chosen.id === "all" ? "" : ` in ${chosen.label}`}.`
      : "";

  return (
    <>
      <FilterBar options={options} current={filter} onChoose={choose} />
      <p role="status" className="sr-only">
        {message}
      </p>
    </>
  );
}

/**
 * The /work discipline filter. Progressive enhancement: without JS every project shows and the links
 * reload the page; with JS the choice applies instantly and stays in the URL (history.replaceState).
 * The page stays static: the URL is read on the client only, inside this Suspense boundary.
 */
export function WorkFilter({ options }: { options: FilterOption[] }) {
  return (
    <nav aria-label="Filter by discipline">
      <Suspense fallback={<FilterBar options={options} current={null} />}>
        <LiveFilter options={options} />
      </Suspense>
    </nav>
  );
}
