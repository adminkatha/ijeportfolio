import type { CSSProperties, ReactNode } from "react";
import "./motion.css";

type RevealProps = {
  children: ReactNode;
  as?: "div" | "section" | "li" | "article" | "header" | "figure";
  className?: string;
  /** Stagger in ms (small). */
  delay?: number;
};

/**
 * Reveals its children once (12px rise + fade, 450ms) when they scroll into view.
 * A server component: it only marks the element; MotionRoot's single IntersectionObserver does the rest.
 * Content is fully visible without JavaScript (the hidden state needs the `js` class) and under reduced motion.
 */
export function Reveal({ children, as: Tag = "div", className, delay }: RevealProps) {
  const style = delay ? ({ "--reveal-delay": `${Math.max(0, Math.round(delay))}ms` } as CSSProperties) : undefined;
  return (
    <Tag className={className} style={style} data-reveal="">
      {children}
    </Tag>
  );
}
