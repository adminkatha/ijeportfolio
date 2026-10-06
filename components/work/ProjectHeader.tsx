import Link from "next/link";
import type { ReactNode } from "react";
import { ColumnGuides } from "@/components/layout/ColumnGuides";
import { Fillable } from "@/components/ui/FillIn";
import { SampleTag } from "@/components/ui/SampleTag";
import { Sep } from "@/components/ui/Sep";
import { pad2, realLink } from "@/components/ui/format";
import { disciplineLabels, type Project } from "@/content/data/schema";

function Meta({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="label-mono text-text-2">{label}</dt>
      <dd className="mt-2 text-text">{children}</dd>
    </div>
  );
}

/** Role, tools, client, year, status, links, metric and result: whatever the project has. */
function ProjectMeta({ project: p }: { project: Project }) {
  const live = realLink(p.liveUrl);
  return (
    <dl className="mt-10 grid gap-x-(--gutter) gap-y-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
      {p.role ? <Meta label="Role">{p.role}</Meta> : null}
      {p.stack.length ? (
        <Meta label="Tools">
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {p.stack.map((tool, i) => (
              <li key={tool} className="flex items-center gap-2">
                {i > 0 ? <Sep /> : null}
                <Fillable value={tool} />
              </li>
            ))}
          </ul>
        </Meta>
      ) : null}
      {p.client ? (
        <Meta label="Client">
          {p.client.url ? (
            <a href={p.client.url} className="link">
              {p.client.name}
            </a>
          ) : (
            p.client.name
          )}
        </Meta>
      ) : null}
      <Meta label={p.year ? "Year" : "Status"}>
        {p.year ? `${p.year} · ` : ""}
        {p.status === "shipped" ? "Shipped" : "In progress"}
      </Meta>
      {p.liveUrl ? (
        <Meta label={p.liveLabel ? "Site" : "Live site"}>
          {live ? (
            <a href={live} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">
              {p.liveLabel ?? new URL(live).hostname.replace(/^www\./, "")} <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Fillable value={p.liveUrl} />
          )}
        </Meta>
      ) : null}
      {p.githubUrl ? (
        <Meta label="Code">
          <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5">
            GitHub <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Meta>
      ) : null}
      {p.metric ? (
        <Meta label={p.metric.label}>
          <span className="type-title text-[2rem]">{p.metric.value}</span>
        </Meta>
      ) : null}
      {p.result ? (
        <Meta label="Result" wide>
          <Fillable value={p.result} />
        </Meta>
      ) : null}
    </dl>
  );
}

/**
 * The top of a project page (all three templates): breadcrumb, number, Sample tag, the page's one <h1>,
 * eyebrow, summary, meta, and the privacy/sample-data disclosures as a small note.
 */
export function ProjectHeader({ project: p, number }: { project: Project; number: number }) {
  return (
    <header className="relative border-b border-line">
      <ColumnGuides span="page" className="absolute inset-0 opacity-60" />
      <div className="container-site relative pt-12 pb-12 md:pt-20 md:pb-16">
        <div className="label-mono flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-text-2">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/work" className="link-quiet inline-flex min-h-11 items-center md:min-h-0">
                  Work
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <Sep />
                <Link href={`/work?d=${p.discipline}`} className="link-quiet inline-flex min-h-11 items-center md:min-h-0">
                  {disciplineLabels[p.discipline]}
                </Link>
              </li>
            </ol>
          </nav>
          <p className="flex items-center gap-3">
            {p.isSample ? <SampleTag /> : null}
            <span>No.{pad2(number)}</span>
          </p>
        </div>
        <h1 className="type-title mt-6 max-w-[22ch] text-[clamp(2.25rem,1.1rem+4.4vw,4.75rem)]">{p.title}</h1>
        <p className="label-mono mt-4 text-text-2">{p.eyebrow}</p>
        <p className="mt-6 max-w-[62ch] text-lg text-text-2 md:text-xl">{p.summary}</p>
        <ProjectMeta project={p} />
        {p.disclosures.length ? (
          <div className="mt-8 flex max-w-[70ch] gap-4 border-l border-text-3 pl-4 text-sm text-text-2">
            <p className="label-mono shrink-0 text-text">Note</p>
            <ul className="space-y-1">
              {p.disclosures.map((d) => (
                <li key={d}>
                  <Fillable value={d} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </header>
  );
}
