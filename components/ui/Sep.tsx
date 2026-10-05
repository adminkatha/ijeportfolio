/** A slanted hairline between list items (a shape, not a glyph, so it never counts as low-contrast text). */
export function Sep() {
  return <span aria-hidden="true" className="inline-block h-[0.95em] w-px shrink-0 rotate-[18deg] bg-text-3" />;
}
