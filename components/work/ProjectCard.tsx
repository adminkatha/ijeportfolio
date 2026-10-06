import Image from "next/image";
import Link from "next/link";
import { TypographicCover } from "@/components/media/TypographicCover";
import { Fillable } from "@/components/ui/FillIn";
import { SampleTag } from "@/components/ui/SampleTag";
import { Sep } from "@/components/ui/Sep";
import { pad2, realLink } from "@/components/ui/format";
import { disciplineLabels, type Project } from "@/content/data/schema";
import { getCaseStudy } from "@/lib/content";
import { coverFit, coverOf } from "./cover";

type ProjectCardProps = {
  project: Project;
  /** Position in the full index (01 …), shared with /work. */
  number: number;
  /** next/image `sizes` for the cover, matching the grid the card sits in. */
  sizes: string;
  /** Heading level inside its section. */
  headingLevel?: "h2" | "h3";
};

/** The case-study / project link label by template. */
export const projectLinkLabel = (p: Project) => (getCaseStudy(p.slug)?.short === false ? "Case study" : "View project");

/**
 * A project as a card: cover (real image, or a typographic cover), discipline, title, eyebrow, summary,
 * metric (only when there is one), stack and links. The title link covers the whole card; the live link
 * sits above it. Never loads a video or a demo iframe, only still images.
 */
export function ProjectCard({ project: p, number, sizes, headingLevel: H = "h3" }: ProjectCardProps) {
  const cover = coverOf(p);
  const live = realLink(p.liveUrl);
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface">
        {cover ? (
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes={sizes}
            className={`transition-transform duration-(--dur-1) ease-out group-hover:scale-[1.02] ${coverFit(cover)}`}
          />
        ) : (
          <TypographicCover title={p.title} discipline={p.discipline} number={number} />
        )}
        {cover?.source === "demo" ? <SampleTag kind="data" className="absolute top-3 left-3 bg-bg" /> : null}
      </div>

      <div className="label-mono mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-text-2">
        <span>{pad2(number)}</span>
        <span aria-hidden="true" className="h-px w-4 bg-text-3" />
        <span>{disciplineLabels[p.discipline]}</span>
        {p.year ? <span>· {p.year}</span> : null}
        {p.status === "in-progress" ? <span>· In progress</span> : null}
        {p.isSample ? <SampleTag className="ml-auto" /> : null}
      </div>

      <H className="type-title mt-3 text-[1.625rem] md:text-[1.875rem]">
        <Link
          href={`/work/${p.slug}`}
          className="after:absolute after:inset-0 after:content-[''] group-hover:text-accent focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
        >
          {p.title}
          <span className="sr-only">, {projectLinkLabel(p).toLowerCase()}</span>
        </Link>
      </H>
      <p className="label-mono mt-2 text-text-2">{p.eyebrow}</p>
      <p className="mt-4 text-text-2">{p.summary}</p>

      {p.metric ? (
        <p className="mt-5 flex items-baseline gap-3">
          <span className="type-title text-[2.25rem] text-text">{p.metric.value}</span>
          <span className="label-mono text-text-2">{p.metric.label}</span>
        </p>
      ) : null}

      {p.stack.length ? (
        <ul className="label-mono mt-5 flex flex-wrap gap-x-2 gap-y-1 text-text-2" aria-label="Tools">
          {p.stack.map((tool, i) => (
            <li key={tool} className="flex items-center gap-2">
              {i > 0 ? <Sep /> : null}
              <Fillable value={tool} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="label-mono mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-6">
        <span aria-hidden="true" className="inline-flex items-center gap-2 text-text">
          {projectLinkLabel(p)}
          <span className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">→</span>
        </span>
        {live ? (
          <a href={live} className="link relative z-10 inline-flex min-h-11 items-center gap-1.5 md:min-h-0" target="_blank" rel="noopener noreferrer">
            {p.liveLabel ?? "Live site"} <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
