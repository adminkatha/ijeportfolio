import Link from "next/link";
import type { ReactNode } from "react";
import { FILL_IN_RE } from "@/content/data/schema";
import { Fillable } from "./FillIn";

type FillableLinkProps = {
  /** A URL or site path, or a fillIn("…") placeholder. */
  href: string;
  children: ReactNode;
  className?: string;
  /** Opens in a new tab (announced to screen readers). */
  newTab?: boolean;
};

/**
 * A link when `href` is real. When it is still a fillIn("…") placeholder, renders the label and a visible
 * [FILL IN: …] instead of a broken link.
 */
export function FillableLink({ href, children, className = "", newTab = false }: FillableLinkProps) {
  // FILL_IN_RE rather than isFillIn(): the type guard would narrow `href` to never in the else branch.
  if (FILL_IN_RE.test(href)) {
    return (
      <span className={className}>
        {children} <Fillable value={href} />
      </span>
    );
  }
  const internal = href.startsWith("/") && !/\.[a-z0-9]+$/i.test(href);
  const tab = newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const content = (
    <>
      {children}
      {newTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </>
  );
  return internal && !newTab ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} className={className} {...tab}>
      {content}
    </a>
  );
}
