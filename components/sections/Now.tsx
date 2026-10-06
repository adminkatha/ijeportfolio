import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { NowContent } from "./NowContent";
import { Section } from "./Section";
import { UpdatedAt } from "./UpdatedAt";

/** [04] Now: what he's building and learning, with the date it was last true. */
export function Now({ number }: { number: number }) {
  return (
    <Section id="now" number={number} title="Now">
      <Reveal className="mt-10 md:mt-12">
        <UpdatedAt className="mb-8" />
        <NowContent headingLevel="h3" />
        <Link href="/now" className="group label-mono mt-10 inline-flex min-h-11 items-center gap-3 text-text hover:text-accent">
          The Now page
          <span aria-hidden="true" className="transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
            →
          </span>
        </Link>
      </Reveal>
    </Section>
  );
}
