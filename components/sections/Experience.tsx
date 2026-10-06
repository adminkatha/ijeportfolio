import { Reveal } from "@/components/motion/Reveal";
import { Sep } from "@/components/ui/Sep";
import { formatMonth, pad2 } from "@/components/ui/format";
import { getExperience, getTraining } from "@/lib/content";
import { Section } from "./Section";

/** "2025" or "2025-03" as <time>. */
function When({ value }: { value: string }) {
  return <time dateTime={value}>{/^\d{4}$/.test(value) ? value : formatMonth(value)}</time>;
}

/** "2019 — 2022", "2023", "2025 — Present"; nothing when the dates aren't known. */
function Dates({ start, end }: { start?: string; end?: string | null }) {
  if (!start) return null;
  if (end === start) return <When value={start} />;
  return (
    <>
      <When value={start} />
      <span aria-hidden="true"> — </span>
      <span className="sr-only"> to </span>
      {end === null ? "Present" : end ? <When value={end} /> : null}
    </>
  );
}

/** [03] Experience: a numbered timeline, newest first, then training. Only what his CV says. */
export function Experience({ number }: { number: number }) {
  const roles = getExperience();
  const training = getTraining();
  return (
    <Section id="experience" number={number} title="Experience" note={`${roles.length} ${roles.length === 1 ? "role" : "roles"}`}>
      <ol className="mt-10 md:mt-12">
        {roles.map((role, i) => (
          <Reveal as="li" key={i} className="relative grid gap-x-(--gutter) gap-y-4 border-t border-line pt-8 pb-12 md:grid-cols-12 lg:grid-cols-9">
            <div className="flex items-start gap-4 md:col-span-4 lg:col-span-3">
              <span className="type-title text-[2.75rem] leading-none text-text-3 md:text-[3.5rem]" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              {role.start ? (
                <p className="label-mono pt-1 text-text-2">
                  <Dates start={role.start} end={role.end} />
                </p>
              ) : null}
            </div>
            <div className="md:col-span-8 lg:col-span-6">
              <h3 className="type-title text-[1.5rem] md:text-[1.75rem]">{role.role}</h3>
              <p className="mt-2 text-text-2">
                {role.url ? (
                  <a href={role.url} className="link">
                    {role.company}
                  </a>
                ) : (
                  role.company
                )}
              </p>
              {role.bullets.length ? (
                <ul className="mt-6 space-y-3">
                  {role.bullets.map((b, j) => (
                    <li key={j} className="grid grid-cols-[1.25rem_minmax(0,1fr)] text-text-2">
                      <span aria-hidden="true" className="mt-[0.7em] block h-px w-2.5 bg-text-3" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {role.tech.length ? (
                <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p id={`experience-tools-${i}`} className="label-mono text-text">
                    Tools
                  </p>
                  <ul aria-labelledby={`experience-tools-${i}`} className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-text-2">
                    {role.tech.map((t, j) => (
                      <li key={t} className="flex items-center gap-2">
                        {j > 0 ? <Sep /> : null}
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Reveal>
        ))}
      </ol>

      {training.length ? (
        <Reveal className="grid gap-x-(--gutter) gap-y-6 border-t border-line pt-8 pb-4 md:grid-cols-12 lg:grid-cols-9">
          <h3 id="experience-training" className="label-mono pt-1 text-text-2 md:col-span-4 lg:col-span-3">
            Training
          </h3>
          <ul aria-labelledby="experience-training" className="space-y-6 md:col-span-8 lg:col-span-6">
            {training.map((t) => (
              <li key={t.name}>
                <p className="text-lg leading-snug font-medium text-text">{t.name}</p>
                <p className="label-mono mt-1 text-text-2">
                  {t.issuer}
                  {t.note ? ` · ${t.note}` : ""}
                </p>
                {t.description ? <p className="mt-2 text-text-2">{t.description}</p> : null}
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}
    </Section>
  );
}
