import { Fillable } from "@/components/ui/FillIn";
import { pad2, realLink } from "@/components/ui/format";
import { getNow } from "@/lib/content";

/** Building + Learning, shared by the homepage Now section (h3) and the /now page (h2). */
export function NowContent({ headingLevel: H }: { headingLevel: "h2" | "h3" }) {
  const now = getNow();
  return (
    <div className="grid gap-x-(--gutter) gap-y-12 md:grid-cols-12 lg:grid-cols-9">
      <div className="md:col-span-7 lg:col-span-5">
        <H id={`now-building-${H}`} className="label-mono text-text-2">
          Building
        </H>
        <ul aria-labelledby={`now-building-${H}`} className="mt-5 divide-y divide-line border-y border-line">
          {now.building.map((item, i) => {
            const url = realLink(item.url);
            return (
              <li key={i} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2 py-5">
                <span aria-hidden="true" className="label-mono pt-[0.35rem] text-text-2">
                  {pad2(i + 1)}
                </span>
                <div>
                  <p className="text-lg leading-snug font-medium text-text">
                    <Fillable value={item.name} />
                  </p>
                  <p className="mt-1 text-text-2">
                    <Fillable value={item.description} />
                  </p>
                  {url ? (
                    <a href={url} className="link label-mono mt-3 inline-flex min-h-11 items-center gap-1.5 md:min-h-0">
                      Visit <span aria-hidden="true">↗</span>
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="md:col-span-5 lg:col-span-4">
        <H id={`now-learning-${H}`} className="label-mono text-text-2">
          Learning
        </H>
        <ul aria-labelledby={`now-learning-${H}`} className="mt-5 divide-y divide-line border-y border-line">
          {now.learning.map((item, i) => (
            <li key={i} className="grid grid-cols-[1.25rem_minmax(0,1fr)] py-5 text-text">
              <span aria-hidden="true" className="mt-[0.8em] block h-px w-2.5 bg-text-3" />
              <span>
                <Fillable value={item} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
