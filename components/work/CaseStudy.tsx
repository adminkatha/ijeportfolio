import { Mdx } from "@/components/mdx/Mdx";
import { pad2 } from "@/components/ui/format";
import type { CaseStudy as CaseStudyDoc } from "@/lib/content";

/**
 * The MDX case study with an in-page index of its H2s (cs.headings; ids match the rendered headings).
 * The index is sticky beside the text from 1024px. A short one (most sections still unanswered) has no index.
 */
export function CaseStudy({ caseStudy }: { caseStudy: CaseStudyDoc }) {
  const index = !caseStudy.short && caseStudy.headings.length > 0;
  return (
    <div className="grid gap-x-(--gutter) gap-y-10 lg:grid-cols-12">
      {index ? (
        <nav aria-label="Case study sections" className="lg:col-span-3">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <p className="label-mono text-text-2">In this case study</p>
            <ol className="mt-3 border-t border-line">
              {caseStudy.headings.map((h, i) => (
                <li key={h.id} className="border-b border-line">
                  <a href={`#${h.id}`} className="label-mono link-quiet flex min-h-11 items-center gap-3 text-text-2 hover:text-text md:min-h-9">
                    <span aria-hidden="true">{pad2(i + 1)}</span>
                    <span>{h.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      ) : null}
      <div className={index ? "lg:col-span-9 xl:col-span-8" : "lg:col-span-9 xl:col-span-8"}>
        {caseStudy.lede ? <p className="mb-10 max-w-[60ch] text-xl leading-relaxed text-text">{caseStudy.lede}</p> : null}
        <Mdx code={caseStudy.body} />
      </div>
    </div>
  );
}
