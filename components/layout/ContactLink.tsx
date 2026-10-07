"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { openContactDialog, prefetchContactDialog } from "@/lib/contact/dialog";

/** "/#contact" on the homepage; elsewhere "/?from=<path>#contact", so the contact form records where the visitor came from. */
export const contactHref = (pathname: string) => (pathname === "/" ? "/#contact" : `/?from=${encodeURIComponent(pathname)}#contact`);

const noSubscribe = () => () => {};

/**
 * A "Let’s connect" link (header, mobile menu). Without JavaScript it goes to the Contact section; with it, a plain
 * click opens the contact pop-up on the current page (ctrl/cmd/shift/alt-clicks keep the link's own behaviour).
 * Hover and focus prefetch the pop-up's chunk. `returnFocus` is where focus goes when the pop-up closes
 * (default: this link).
 */
export function ContactLink({ className, children, returnFocus }: { className?: string; children: ReactNode; returnFocus?: () => HTMLElement | null }) {
  // Only announced as opening a dialog once the script that opens it is running.
  const enhanced = useSyncExternalStore(noSubscribe, () => true, () => false);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (openContactDialog(returnFocus?.() ?? e.currentTarget)) e.preventDefault();
  };

  return (
    <Link
      href={contactHref(usePathname())}
      className={className}
      aria-haspopup={enhanced ? "dialog" : undefined}
      onClick={onClick}
      onPointerEnter={prefetchContactDialog}
      onFocus={prefetchContactDialog}
    >
      {children}
    </Link>
  );
}
