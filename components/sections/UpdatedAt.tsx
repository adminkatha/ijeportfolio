import { Fillable } from "@/components/ui/FillIn";
import { formatDate } from "@/components/ui/format";
import { isFillIn } from "@/content/data/schema";
import { getNow } from "@/lib/content";

/** "Updated 6 Oct 2026", or the visible placeholder while the date is unknown. */
export function UpdatedAt({ className = "" }: { className?: string }) {
  const { updatedAt } = getNow();
  return (
    <p className={`label-mono text-text-2 ${className}`}>
      Updated{" "}
      {isFillIn(updatedAt) ? <Fillable value={updatedAt} /> : <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>}
    </p>
  );
}
