type ColumnGuidesProps = {
  /**
   * "page": the 12 columns of the 1280px container (use inside a full-bleed parent).
   * "content": the homepage content column, which spans 9 of the 12 columns at ≥1024px.
   */
  span: "page" | "content";
  className?: string;
};

/**
 * Construction lines: the hairline edges of the 12-column grid, shown faintly at section dividers.
 * Purely decorative; the parent positions it (e.g. `absolute inset-x-0 top-0 h-12`).
 */
export function ColumnGuides({ span, className = "" }: ColumnGuidesProps) {
  const columns = (
    <div className={`grid h-full gap-x-(--gutter) ${span === "content" ? "grid-cols-12 lg:grid-cols-9" : "grid-cols-12"}`}>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={`border-x border-line ${span === "content" && i >= 9 ? "lg:hidden" : ""}`} />
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      {span === "page" ? <div className="container-site h-full">{columns}</div> : columns}
    </div>
  );
}
