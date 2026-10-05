type SectionLabelProps = {
  /** 1-based position among the *visible* sections; computed, never hard-coded. */
  number: number;
  title: string;
  /** Short note on the right of the divider (hidden under 640px). */
  note?: string;
  /** id for the heading, so the section can use aria-labelledby. */
  id?: string;
  as?: "h2" | "h3" | "p";
  className?: string;
};

/** `[01] SELECTED WORK ──────── note`: the number in accent, a thin divider, a short note. */
export function SectionLabel({ number, title, note, id, as: Tag = "h2", className = "" }: SectionLabelProps) {
  const n = String(number).padStart(2, "0");
  return (
    <div className={`label-mono flex items-center gap-4 text-text-2 ${className}`}>
      <Tag id={id} className="shrink-0 font-normal">
        <span aria-hidden="true">[</span>
        <span className="text-accent">{n}</span>
        <span aria-hidden="true">]</span>
        <span className="sr-only">. </span> {title}
      </Tag>
      <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line" />
      {note ? <span className="hidden shrink-0 sm:block">{note}</span> : null}
    </div>
  );
}
