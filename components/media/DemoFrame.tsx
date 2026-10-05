import { SampleTag } from "@/components/ui/SampleTag";
import type { Demo } from "@/content/data/schema";

/**
 * A live, read-only dashboard demo (static, offline, sample data) in a lazy, sandboxed iframe sized for a
 * desktop dashboard (16:10 from 768px; a tall frame on phones), with "Open full screen" in a new tab.
 * Always labelled as sample data, never presented as results. Never used on the homepage.
 */
export function DemoFrame({ demo }: { demo: Demo }) {
  const name = demo.title.toLowerCase().includes(demo.client.toLowerCase()) ? demo.title : `${demo.client}: ${demo.title}`;
  return (
    <figure>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-b-0 border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SampleTag kind="data" />
          <span className="label-mono text-text">{name}</span>
        </div>
        <a href={demo.src} target="_blank" rel="noopener noreferrer" className="label-mono link inline-flex min-h-11 items-center gap-1.5 md:min-h-0">
          Open full screen <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <div className="border border-line bg-surface">
        <iframe
          src={demo.src}
          title={`${name}: live demo with sample data`}
          loading="lazy"
          sandbox="allow-scripts"
          className="block h-[75svh] max-h-[44rem] min-h-[26rem] w-full md:aspect-[16/10] md:h-auto md:max-h-none md:min-h-0"
        />
      </div>
      <figcaption className="mt-3 max-w-[70ch] text-sm text-text-2">
        A read-only demo running on sample data. The figures are not real results.
        {demo.note ? ` ${demo.note}` : null}
      </figcaption>
    </figure>
  );
}
