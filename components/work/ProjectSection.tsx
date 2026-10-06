import type { ReactNode } from "react";
import { ColumnGuides } from "@/components/layout/ColumnGuides";
import { SectionLabel } from "@/components/ui/SectionLabel";

type ProjectSectionProps = {
  id: string;
  /** Position among this page's visible sections (computed, no gaps). */
  number: number;
  title: string;
  note?: string;
  /** "p" when the content brings its own <h2>s (the MDX case study). */
  labelAs?: "h2" | "p";
  children: ReactNode;
};

/** A section of a project page: construction lines at the divider, the numbered label, the content. */
export function ProjectSection({ id, number, title, note, labelAs = "h2", children }: ProjectSectionProps) {
  const labelId = `${id}-label`;
  return (
    <section id={id} aria-labelledby={labelAs === "h2" ? labelId : undefined} className="relative border-t border-line pt-14 pb-16 first:border-t-0 md:pt-16 md:pb-24">
      <ColumnGuides span="container" className="absolute inset-x-0 top-0 h-2.5 md:h-3" />
      <SectionLabel number={number} title={title} note={note} id={labelId} as={labelAs} />
      <div className="mt-10 md:mt-12">{children}</div>
    </section>
  );
}
