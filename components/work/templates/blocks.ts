import type { ReactNode } from "react";

/** A section a template may show; falsy entries (no media, no case study) are dropped. */
export type Block = false | 0 | undefined | null | { id: string; title: string; note?: string; labelAs?: "h2" | "p"; body: ReactNode };

type Shown = Exclude<Block, false | 0 | undefined | null>;

/** Keeps the blocks that exist and numbers them 1… in order, so the labels never have gaps. */
export const numbered = (blocks: Block[]) => blocks.filter((b): b is Shown => Boolean(b)).map((b, i) => ({ ...b, number: i + 1 }));
