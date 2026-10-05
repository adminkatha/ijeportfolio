import { pad2 } from "@/components/ui/format";
import { disciplineLabels, type Discipline } from "@/content/data/schema";

type TypographicCoverProps = {
  title: string;
  discipline: Discipline;
  /** The project's position in the index (01, 02 …). */
  number: number;
  className?: string;
};

/** A print registration mark (decorative). */
function RegistrationMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={className}>
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 0v24M0 12h24" />
    </svg>
  );
}

/**
 * The fallback cover when a project has no images: its title set as type on the construction grid.
 * No imagery (never stock). Decorative (aria-hidden): the same words appear as real text beside it.
 * Sizes itself from its own width (container query units), so it works on cards, rows and pages.
 */
export function TypographicCover({ title, discipline, number, className = "" }: TypographicCoverProps) {
  return (
    <div aria-hidden="true" className={`@container relative size-full overflow-hidden bg-surface select-none ${className}`}>
      <div className="absolute inset-y-0 inset-x-[6cqi] grid grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="border-l border-line last:border-r" />
        ))}
      </div>
      <span className="absolute inset-x-0 top-[calc(6cqi+1.75rem)] h-px bg-line" />
      <div className="label-mono absolute inset-x-[6cqi] top-[6cqi] flex items-start justify-between gap-4 px-[0.4em] text-text-2">
        <span>{disciplineLabels[discipline]}</span>
        <span>No.{pad2(number)}</span>
      </div>
      <RegistrationMark className="absolute top-[calc(6cqi+1.75rem-0.5625rem)] right-[calc(6cqi-0.5625rem)] size-[1.125rem] text-text-3" />
      <p className="absolute inset-x-[6cqi] bottom-[5.5cqi] px-[0.08em] font-display text-[clamp(1.5rem,9.5cqi,5.25rem)] leading-[0.9] font-bold tracking-[-0.045em] text-balance text-text uppercase">
        {title}
      </p>
    </div>
  );
}
