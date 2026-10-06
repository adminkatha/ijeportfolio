"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** "/#contact" on the homepage; elsewhere "/?from=<path>#contact", so the contact form records where the visitor came from. */
export const hireHref = (pathname: string) => (pathname === "/" ? "/#contact" : `/?from=${encodeURIComponent(pathname)}#contact`);

/** The "Hire me" link (header). */
export function HireLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Link href={hireHref(usePathname())} className={className}>
      {children}
    </Link>
  );
}
