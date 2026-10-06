import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/work/ProjectCard";
import { disciplineLabels, disciplines } from "@/content/data/schema";
import { disciplinesOf, getFeaturedProjects, getProjects } from "@/lib/content";
import { Section } from "./Section";

/** Card cover widths: 2-up in the 9-column content column at ≥1024px, 2-up from 768px, full width below. */
export const CARD_SIZES = "(min-width: 1328px) 465px, (min-width: 1024px) 36vw, (min-width: 768px) 47vw, calc(100vw - 32px)";

/** [01] Selected work: the featured projects as cards, then a way into the full index. */
export function SelectedWork({ number }: { number: number }) {
  const all = getProjects();
  const featured = getFeaturedProjects();
  const indexOf = (slug: string) => all.findIndex((p) => p.slug === slug) + 1;
  const counts = disciplines
    .map((d) => ({ d, n: all.filter((p) => disciplinesOf(p).includes(d)).length }))
    .filter((c) => c.n > 0);
  return (
    <Section id="work" number={number} title="Selected work" note={`${featured.length} of ${all.length}`}>
      <ul className="mt-10 grid gap-x-6 gap-y-16 md:mt-12 md:grid-cols-2">
        {featured.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 60}>
            <ProjectCard project={p} number={indexOf(p.slug)} sizes={CARD_SIZES} />
          </Reveal>
        ))}
      </ul>
      <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
        <Link href="/work" className="group label-mono inline-flex min-h-11 items-center gap-3 border border-text-3 px-5 text-text hover:border-text">
          All work ({all.length})
          <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
            →
          </span>
        </Link>
        <ul className="label-mono flex flex-wrap gap-x-5 gap-y-1 text-text-2" aria-label="Work by discipline">
          {counts.map(({ d, n }) => (
            <li key={d}>
              <Link href={`/work?d=${d}`} className="link-quiet inline-flex min-h-11 items-center gap-1.5 md:min-h-0">
                {disciplineLabels[d]}
                <span className="text-text">{n}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
