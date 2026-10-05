import type { ReactNode } from "react";
import { ColumnGuides } from "@/components/layout/ColumnGuides";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { HomeSectionId } from "@/lib/content";

type SectionProps = {
  id: HomeSectionId;
  /** From getHomeSections(): numbered among the visible sections, never hard-coded. */
  number: number;
  title: string;
  note?: string;
  /**
   * When the section has its own display heading (Contact), pass that heading's id: the label then renders
   * as a <p> and the section is named by the heading.
   */
  headingId?: string;
  className?: string;
  children: ReactNode;
};

/** A homepage section: construction lines at the divider, the `[01] TITLE ──── note` label, then content. */
export function Section({ id, number, title, note, headingId, className = "", children }: SectionProps) {
  const labelId = `${id}-label`;
  return (
    <section id={id} aria-labelledby={headingId ?? labelId} className={`relative pt-14 pb-20 md:pt-16 md:pb-28 ${className}`}>
      <ColumnGuides span="content" className="absolute inset-x-0 top-0 h-2.5 md:h-3" />
      <SectionLabel number={number} title={title} note={note} id={labelId} as={headingId ? "p" : "h2"} />
      {children}
    </section>
  );
}
