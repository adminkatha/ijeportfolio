import { MDXContent } from "@content-collections/mdx/react";
import { Container } from "@/components/layout/Grid";
import { FillIn, Fillable } from "@/components/ui/FillIn";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { disciplineLabels } from "@/content/data/schema";
import { getCaseStudy, getHomeSections, getProfile, getProjects } from "@/lib/content";

// Phase 2 content check: data, [FILL IN] rendering, computed section numbers, one compiled case study.
// Replaced by the real homepage in later phases.
export default function Home() {
  const profile = getProfile();
  const sections = getHomeSections();
  const caseStudy = getCaseStudy("sabbath-spa");
  return (
    <main id="main" className="py-24">
      <Container className="space-y-16">
        <header className="space-y-6">
          <h1 className="type-display">{profile.name}</h1>
          <p className="max-w-[48ch] text-lg text-text-2">{profile.roleLine}</p>
          <p className="text-text-2">
            Location: <Fillable value={profile.location} />
          </p>
        </header>

        <section aria-labelledby="work" className="space-y-6">
          <SectionLabel number={sections[0]!.number} title="Work (content check)" id="work" note={`${getProjects().length} projects`} />
          <ul className="divide-y divide-line border-y border-line">
            {getProjects().map((p) => (
              <li key={p.slug} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                <span className="label-mono text-text-2">{disciplineLabels[p.discipline]}</span>
                <span>
                  <span className="font-medium">{p.title}</span>
                  <span className="text-text-2"> — {p.summary}</span>
                  {p.liveUrl ? (
                    <span className="block text-sm text-text-2">
                      Live: <Fillable value={p.liveUrl} />
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sections" className="space-y-4">
          <SectionLabel number={sections[1]!.number} title="Visible sections" id="sections" />
          <ol className="label-mono space-y-1 text-text-2">
            {sections.map((s) => (
              <li key={s.id}>
                [{String(s.number).padStart(2, "0")}] {s.title}
              </li>
            ))}
          </ol>
        </section>

        {caseStudy ? (
          <article aria-label="Case study check" className="max-w-[65ch] space-y-4 text-text-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-text">
            <MDXContent code={caseStudy.body} components={{ FillIn }} />
          </article>
        ) : null}
      </Container>
    </main>
  );
}
