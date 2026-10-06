import { isFillIn } from "@/content/data/schema";

/**
 * An unanswered question, fillIn("…") in data or <FillIn> in MDX. It renders nothing: the site hides
 * whatever isn't known yet. The questions stay in the source; `pnpm fill-ins` lists them (docs/INTAKE.md).
 */
export function FillIn({ children }: { children: string }) {
  void children;
  return null;
}

/** A content string, or nothing when it's still a fillIn("…") placeholder. */
export function Fillable({ value }: { value: string }) {
  return isFillIn(value) ? null : <>{value}</>;
}
