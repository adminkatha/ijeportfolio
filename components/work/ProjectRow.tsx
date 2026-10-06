import Image from "next/image";
import Link from "next/link";
import { TypographicCover } from "@/components/media/TypographicCover";
import { SampleTag } from "@/components/ui/SampleTag";
import { Sep } from "@/components/ui/Sep";
import { pad2 } from "@/components/ui/format";
import { disciplineLabels, type Project } from "@/content/data/schema";
import { disciplinesOf } from "@/lib/content";
import { coverFit, coverOf } from "./cover";
import { projectLinkLabel } from "./ProjectCard";

const ROW_COVER_SIZES = "(min-width: 1328px) 302px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, calc(100vw - 32px)";

/**
 * One entry in the /work index: a list row on wide screens (number, title, summary, disciplines, cover),
 * a card on phones. data-disciplines drives the discipline filter (CSS hides rows, so it works before
 * hydration and the list is complete without JS).
 */
export function ProjectRow({ project: p, number }: { project: Project; number: number }) {
  const cover = coverOf(p);
  const all = disciplinesOf(p);
  return (
    <li data-work-item="" data-disciplines={all.join(" ")} className="group relative border-b border-line">
      <article className="grid gap-x-(--gutter) gap-y-5 py-8 md:grid-cols-12 md:py-10">
        <p aria-hidden="true" className="label-mono hidden pt-2 text-text-2 lg:col-span-1 lg:block">
          {pad2(number)}
        </p>
        <div className="md:col-span-8 lg:col-span-6">
          <p className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-text-2">
            <span aria-hidden="true" className="inline-flex items-center gap-2 lg:hidden">
              {pad2(number)}
              <Sep />
            </span>
            {all.map((d, i) => (
              <span key={d} className="inline-flex items-center gap-2">
                {i > 0 ? <Sep /> : null}
                {disciplineLabels[d]}
              </span>
            ))}
          </p>
          <h2 className="type-title mt-3 text-[1.75rem] md:text-[2.25rem]">
            <Link
              href={`/work/${p.slug}`}
              className="after:absolute after:inset-0 after:content-[''] group-hover:text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
            >
              {p.title}
              <span className="sr-only">, {projectLinkLabel(p).toLowerCase()}</span>
            </Link>
          </h2>
          <p className="label-mono mt-2 text-text-2">{p.eyebrow}</p>
          <p className="mt-4 max-w-[60ch] text-text-2">{p.summary}</p>
        </div>
        <div className="label-mono flex flex-wrap content-start items-center gap-x-4 gap-y-2 text-text-2 md:col-span-8 md:col-start-1 md:row-start-2 lg:col-span-2 lg:col-start-auto lg:row-start-auto lg:flex-col lg:items-start lg:pt-2">
          {p.year ? <span>{p.year}</span> : null}
          <span>{p.status === "shipped" ? "Shipped" : "In progress"}</span>
          {p.isSample ? <SampleTag /> : null}
          <span aria-hidden="true" className="inline-flex items-center gap-2 text-text">
            {projectLinkLabel(p)}
            <span className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">→</span>
          </span>
        </div>
        <div className="relative -order-1 aspect-[4/3] overflow-hidden border border-line bg-surface md:order-none md:col-span-4 md:row-span-2 lg:col-span-3 lg:row-span-1">
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes={ROW_COVER_SIZES}
              className={`transition-transform duration-(--dur-1) ease-out group-hover:scale-[1.02] ${coverFit(cover)}`}
            />
          ) : (
            <TypographicCover title={p.title} discipline={p.discipline} number={number} />
          )}
          {cover?.source === "demo" ? <SampleTag kind="data" className="absolute top-3 left-3 bg-bg" /> : null}
        </div>
      </article>
    </li>
  );
}
