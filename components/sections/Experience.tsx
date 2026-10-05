import { Reveal } from "@/components/motion/Reveal";
import { Fillable } from "@/components/ui/FillIn";
import { formatMonth, pad2 } from "@/components/ui/format";
import { isFillIn } from "@/content/data/schema";
import { getExperience } from "@/lib/content";
import { Section } from "./Section";

/** A "YYYY-MM" month as <time>, or the visible placeholder. */
function Month({ value }: { value: string }) {
  return isFillIn(value) ? <Fillable value={value} /> : <time dateTime={value}>{formatMonth(value)}</time>;
}

/** [03] Experience: a numbered timeline, newest first. Every field may still be a [FILL IN]. */
export function Experience({ number }: { number: number }) {
  const roles = getExperience();
  return (
    <Section id="experience" number={number} title="Experience" note={`${roles.length} ${roles.length === 1 ? "role" : "roles"}`}>
      <ol className="mt-10 md:mt-12">
        {roles.map((role, i) => (
          <Reveal as="li" key={i} className="relative grid gap-x-(--gutter) gap-y-4 border-t border-line pt-8 pb-12 md:grid-cols-12 lg:grid-cols-9">
            <div className="flex items-start gap-4 md:col-span-4 lg:col-span-3">
              <span className="type-title text-[2.75rem] leading-none text-text-3 md:text-[3.5rem]" aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <p className="label-mono pt-1 text-text-2">
                <Month value={role.start} />
                <span aria-hidden="true"> — </span>
                <span className="sr-only"> to </span>
                {role.end === null ? "Present" : <Month value={role.end} />}
              </p>
            </div>
            <div className="md:col-span-8 lg:col-span-6">
              <h3 className="type-title text-[1.5rem] md:text-[1.75rem]">{role.role}</h3>
              <p className="mt-2 text-text-2">
                {role.url && !isFillIn(role.company) ? (
                  <a href={role.url} className="link">
                    {role.company}
                  </a>
                ) : (
                  <Fillable value={role.company} />
                )}
                {role.freelance ? <span className="label-mono ml-3 border border-text-3 px-2 py-0.5">Freelance</span> : null}
              </p>
              <ul className="mt-6 space-y-3">
                {role.bullets.map((b, j) => (
                  <li key={j} className="grid grid-cols-[1.25rem_minmax(0,1fr)] text-text-2">
                    <span aria-hidden="true" className="mt-[0.7em] block h-px w-2.5 bg-text-3" />
                    <span>
                      <Fillable value={b} />
                    </span>
                  </li>
                ))}
              </ul>
              {role.tech.length ? (
                <p className="label-mono mt-6 text-text-2">
                  <span className="text-text">Tools</span>
                  <span aria-hidden="true" className="mx-2 text-text-3">
                    —
                  </span>
                  {role.tech.map((t, j) => (
                    <span key={t}>
                      {j > 0 ? <span className="text-text-3"> / </span> : null}
                      <Fillable value={t} />
                    </span>
                  ))}
                </p>
              ) : null}
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
