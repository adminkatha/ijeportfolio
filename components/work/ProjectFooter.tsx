import Link from "next/link";
import { getNeighbors, getProject, getProjects } from "@/lib/content";
import type { Project } from "@/content/data/schema";
import { ProjectCard } from "./ProjectCard";
import { ProjectSection } from "./ProjectSection";

/** Related cards sit two-up in the full 1280px container. */
const RELATED_SIZES = "(min-width: 1328px) 628px, (min-width: 768px) 48vw, calc(100vw - 32px)";

/** Related projects (project.related) as cards, then previous / next in index order. */
export function ProjectFooter({ project, sectionNumber }: { project: Project; sectionNumber: number }) {
  const all = getProjects();
  const related = project.related.map(getProject).filter((p): p is Project => p !== undefined);
  const neighbors = getNeighbors(project.slug);
  const indexOf = (slug: string) => all.findIndex((p) => p.slug === slug) + 1;
  return (
    <>
      {related.length ? (
        <div className="container-site">
          <ProjectSection id="related" number={sectionNumber} title="Related work">
            <ul className="grid gap-x-(--gutter) gap-y-16 md:grid-cols-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <ProjectCard project={r} number={indexOf(r.slug)} sizes={RELATED_SIZES} />
                </li>
              ))}
            </ul>
          </ProjectSection>
        </div>
      ) : null}
      {neighbors ? (
        <nav aria-label="More work" className="border-t border-line">
          <div className="container-site grid md:grid-cols-2">
            <Link href={`/work/${neighbors.prev.slug}`} className="group flex flex-col gap-3 py-10 md:pr-8">
              <span className="label-mono inline-flex items-center gap-2 text-text-2">
                <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:-translate-x-1">
                  ←
                </span>
                Previous
              </span>
              <span className="type-title text-[1.5rem] group-hover:text-accent md:text-[1.875rem]">{neighbors.prev.title}</span>
            </Link>
            <Link
              href={`/work/${neighbors.next.slug}`}
              className="group flex flex-col gap-3 border-t border-line py-10 md:items-end md:border-t-0 md:border-l md:pl-8 md:text-right"
            >
              <span className="label-mono inline-flex items-center gap-2 text-text-2">
                Next
                <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
                  →
                </span>
              </span>
              <span className="type-title text-[1.5rem] group-hover:text-accent md:text-[1.875rem]">{neighbors.next.title}</span>
            </Link>
          </div>
        </nav>
      ) : null}
    </>
  );
}
