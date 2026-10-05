import Link from "next/link";
import { getPlayground } from "@/lib/content";
import { CARD_SIZES } from "./SelectedWork";
import { PlaygroundGrid } from "./PlaygroundGrid";
import { Section } from "./Section";

const PREVIEW = 4;

/** Playground on the homepage. Renders nothing while there are no items (no DOM, no nav link, no number). */
export function PlaygroundPreview({ number }: { number: number }) {
  const items = getPlayground();
  if (!items.length) return null;
  return (
    <Section id="playground" number={number} title="Playground" note={`${items.length} ${items.length === 1 ? "experiment" : "experiments"}`}>
      <div className="mt-10 md:mt-12">
        <PlaygroundGrid items={items.slice(0, PREVIEW)} headingLevel="h3" sizes={CARD_SIZES} />
      </div>
      <Link href="/playground" className="group label-mono mt-12 inline-flex min-h-11 items-center gap-3 text-text hover:text-accent">
        {items.length > PREVIEW ? `All ${items.length} experiments` : "The Playground"}
        <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
          →
        </span>
      </Link>
    </Section>
  );
}
