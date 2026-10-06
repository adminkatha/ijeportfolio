import { MDXContent } from "@content-collections/mdx/react";
import Link from "next/link";
import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { FillIn, Fillable } from "@/components/ui/FillIn";

/** Same slug rule as headingsOf() in content-collections.ts, so in-page links match `headings[].id`. */
const toId = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Plain text of rendered MDX children (for heading ids). */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function H2({ children }: { children?: ReactNode }) {
  return <h2 id={toId(textOf(Children.toArray(children)))}>{children}</h2>;
}

function H3({ children }: { children?: ReactNode }) {
  return <h3 id={toId(textOf(Children.toArray(children)))}>{children}</h3>;
}

function A({ href = "", children }: ComponentProps<"a">) {
  if (href.startsWith("/") && !href.startsWith("//")) return <Link href={href}>{children}</Link>;
  if (href.startsWith("#") || href.startsWith("mailto:")) return <a href={href}>{children}</a>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Components available to every MDX file (case studies use <FillIn> for unanswered questions). */
export const mdxComponents = { FillIn, Fillable, h2: H2, h3: H3, a: A };

/** Compiled MDX (from content-collections) with the site's prose styles. Server-rendered; no client JS. */
export function Mdx({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={`prose-site ${className}`}>
      <MDXContent code={code} components={mdxComponents} />
    </div>
  );
}
