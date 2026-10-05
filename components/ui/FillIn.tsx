import { isFillIn } from "@/content/data/schema";

/** A visible gap: `[FILL IN: question]`. Every one is listed in docs/INTAKE.md. */
export function FillIn({ children }: { children: string }) {
  return (
    <mark className="rounded-[2px] border border-dashed border-accent/70 bg-transparent px-1 font-mono text-[0.8em] text-accent [overflow-wrap:anywhere]">
      [FILL IN: {children}]
    </mark>
  );
}

/** Renders a content string, or a <FillIn> when the string is a fillIn("…") placeholder. */
export function Fillable({ value }: { value: string }) {
  return isFillIn(value) ? <FillIn>{value.slice("[FILL IN: ".length, -1)}</FillIn> : <>{value}</>;
}
