import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Sep } from "@/components/ui/Sep";
import { pad2 } from "@/components/ui/format";
import { getCapabilities, getProject } from "@/lib/content";
import { Section } from "./Section";

/**
 * [02] Capabilities: Marketing / Creative / Web, as a spec sheet. Each skill shows its evidence (a job or a
 * project, linked when there is a project) where there is one, and each group ends with the tools he uses.
 */
export function Capabilities({ number }: { number: number }) {
  const groups = getCapabilities();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  // Items are numbered 01… across all groups.
  const startOf = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.items.length, 0));
  return (
    <Section id="capabilities" number={number} title="Capabilities" note={`${total} skills and the tools behind them`}>
      <div className="mt-10 divide-y divide-line border-y border-line md:mt-12">
        {groups.map((group, gi) => {
          const headingId = `capabilities-${group.group.toLowerCase()}`;
          return (
            <Reveal key={group.group} className="grid gap-x-(--gutter) gap-y-6 py-8 md:grid-cols-12 md:py-10 lg:grid-cols-9">
              <h3 id={headingId} className="type-title text-[1.75rem] uppercase md:col-span-4 lg:col-span-3 lg:text-[2rem]">
                {group.group}
              </h3>
              <div className="md:col-span-8 lg:col-span-6">
                <ul aria-labelledby={headingId} className="space-y-8">
                  {group.items.map((item, ii) => {
                    const project = item.projectSlug ? getProject(item.projectSlug) : undefined;
                    return (
                      <li key={item.name} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2">
                        <span aria-hidden="true" className="label-mono pt-[0.3rem] text-text-2">
                          {pad2(startOf[gi]! + ii + 1)}
                        </span>
                        <div>
                          <p className="text-lg leading-snug font-medium text-text">{item.name}</p>
                          {item.evidence && project ? (
                            <Link href={`/work/${project.slug}`} className="group mt-2 block">
                              <span className="text-text-2 underline decoration-text-3 decoration-1 underline-offset-[0.22em] group-hover:text-text group-hover:decoration-accent">
                                {item.evidence}
                              </span>
                              <span className="label-mono mt-2 flex items-center gap-2 text-text group-hover:text-accent">
                                <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-0.5">
                                  →
                                </span>
                                {project.title}
                              </span>
                            </Link>
                          ) : item.evidence ? (
                            <p className="mt-2 text-text-2">{item.evidence}</p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {group.tools.length ? (
                  <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-5">
                    <p id={`${headingId}-tools`} className="label-mono text-text">
                      Tools
                    </p>
                    <ul aria-labelledby={`${headingId}-tools`} className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-text-2">
                      {group.tools.map((t, ti) => (
                        <li key={t} className="flex items-center gap-2">
                          {ti > 0 ? <Sep /> : null}
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
