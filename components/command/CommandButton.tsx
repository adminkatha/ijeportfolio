"use client";
// STUB (owned by the hero/palette agent; replaced in phase 12). Keep this export name and props.
import type { CommandItem } from "./types";

/** Header button + global ⌘K/Ctrl+K; loads the palette on demand. */
export function CommandButton({ items }: { items: CommandItem[] }) {
  return (
    <button type="button" className="label-mono border border-line px-2 py-1 text-text-2" aria-label={`Open command menu (${items.length} commands)`}>
      ⌘K
    </button>
  );
}
