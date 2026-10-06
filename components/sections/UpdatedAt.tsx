import { formatDate } from "@/components/ui/format";
import { getNow } from "@/lib/content";

/** "Updated 6 Oct 2026"; nothing while the date is unknown. */
export function UpdatedAt({ className = "" }: { className?: string }) {
  const { updatedAt } = getNow();
  if (!updatedAt) return null;
  return (
    <p className={`label-mono text-text-2 ${className}`}>
      Updated <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
    </p>
  );
}
