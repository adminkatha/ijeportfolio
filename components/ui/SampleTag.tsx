/**
 * Accent-outlined tag. "campaign" marks sample (spec) campaigns everywhere they appear;
 * "data" marks live demos that run on sample data.
 */
export function SampleTag({ kind = "campaign", className = "" }: { kind?: "campaign" | "data"; className?: string }) {
  return (
    <span className={`label-mono inline-block border border-accent px-2 py-0.5 text-accent ${className}`}>
      {kind === "campaign" ? "Sample campaign" : "Demo — sample data"}
    </span>
  );
}
