"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "./nav";

type NavLinksProps = {
  items: NavItem[];
  /** "bar": the desktop header row. "panel": the stacked mobile menu. */
  variant: "bar" | "panel";
};

/** Primary nav links with the current route marked (aria-current). */
export function NavLinks({ items, variant }: NavLinksProps) {
  const pathname = usePathname();
  return (
    <ul className={variant === "bar" ? "flex items-center gap-1" : "divide-y divide-line border-y border-line"}>
      {items.map((item) => {
        const current = !item.match
          ? undefined
          : pathname === item.match
            ? ("page" as const)
            : pathname.startsWith(`${item.match}/`)
              ? ("true" as const)
              : undefined;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current}
              className={
                variant === "bar"
                  ? "label-mono link-quiet inline-flex h-10 items-center px-3 text-text-2 aria-[current]:text-text aria-[current]:underline aria-[current]:decoration-accent aria-[current]:decoration-1 aria-[current]:underline-offset-[0.55em]"
                  : "group flex min-h-14 items-center justify-between gap-4 py-2 font-display text-[1.75rem] font-semibold uppercase tracking-[-0.02em] text-text hover:text-accent aria-[current]:text-accent"
              }
            >
              {item.label}
              {variant === "panel" ? (
                <span aria-hidden="true" className="label-mono text-text-2 transition-transform duration-(--dur-1) ease-out group-hover:translate-x-1">
                  →
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
