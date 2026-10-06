import Image from "next/image";
import { SampleTag } from "@/components/ui/SampleTag";
import type { Demo } from "@/content/data/schema";
import { DemoEmbed } from "./DemoEmbed";

const NEW_TAB = <span className="sr-only"> (opens in a new tab)</span>;

/**
 * A live, read-only dashboard demo (static, offline, sample data). From 768px: a lazy, sandboxed iframe at a
 * desktop height (the dashboard scrolls inside it). On phones: its preview and a prominent "Open full screen".
 * Always labelled as sample data and never presented as results. Never used on the homepage.
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
        <a href={demo.src} target="_blank" rel="noopener noreferrer" className="label-mono link hidden items-center gap-1.5 md:inline-flex">
          Open full screen <span aria-hidden="true">↗</span>
          {NEW_TAB}
        </a>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden border border-line bg-surface md:aspect-auto md:h-[760px]">
        <DemoEmbed src={demo.src} title={`${name}: live demo with sample data`}>
          <Image src={demo.preview.src} alt="" fill sizes="(min-width: 768px) 1280px, calc(100vw - 32px)" className="object-cover object-top" />
        </DemoEmbed>
      </div>
      <a
        href={demo.src}
        target="_blank"
        rel="noopener noreferrer"
        className="label-mono mt-3 flex min-h-12 items-center justify-between gap-4 border border-text-3 px-4 text-text hover:border-text md:hidden"
      >
        Open the live demo full screen <span aria-hidden="true">↗</span>
        {NEW_TAB}
      </a>
      <figcaption className="mt-3 max-w-[70ch] text-sm text-text-2">
        A read-only demo running on sample data. The figures are not real results.
        {demo.note ? ` ${demo.note}` : null}
      </figcaption>
    </figure>
  );
}
