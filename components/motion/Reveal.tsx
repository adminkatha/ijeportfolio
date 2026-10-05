// STUB (owned by the motion agent; replaced in phase 14). Keep this export name and props.
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: "div" | "section" | "li" | "article" | "header" | "figure";
  className?: string;
  /** Stagger in ms (small). */
  delay?: number;
};

/** Reveals its children once (12px rise + fade, 450ms). Content is fully visible without JS and under reduced motion. */
export function Reveal({ children, as: Tag = "div", className }: RevealProps) {
  return <Tag className={className}>{children}</Tag>;
}
