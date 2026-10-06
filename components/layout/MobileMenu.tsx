"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { hireHref } from "./HireLink";
import type { NavItem } from "./nav";
import { NavLinks } from "./NavLinks";

/**
 * The menu under 768px: a disclosure button (aria-expanded / aria-controls) and a panel under the header.
 * Esc closes it and returns focus to the button; it also closes when a link is chosen, when focus or a
 * tap leaves it, on navigation, and when the viewport grows past 768px. (Without JS the footer nav remains.)
 */
export function MobileMenu({ items, resumeHref }: { items: NavItem[]; resumeHref?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(pathname);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // Close on navigation (state adjusted during render, not in an effect).
  if (pathname !== path) {
    setPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false);
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (wide.matches) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (open && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
  };
  const onPanelClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof Element && e.target.closest("a")) setOpen(false);
  };

  return (
    <div ref={root} onBlur={onBlur} className="md:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="group label-mono flex h-11 min-w-11 cursor-pointer items-center gap-2.5 border border-text-3 px-3 text-text select-none"
      >
        Menu
        <span aria-hidden="true" className="relative block h-2.5 w-3.5">
          <span className="absolute inset-x-0 top-0 h-px bg-current transition-transform duration-(--dur-1) ease-out group-aria-expanded:translate-y-[4.5px] group-aria-expanded:rotate-45" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-(--dur-1) ease-out group-aria-expanded:-translate-y-[4.5px] group-aria-expanded:-rotate-45" />
        </span>
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        onClick={onPanelClick}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-b border-line bg-bg bg-[url(/grain.png)]"
      >
        <nav aria-label="Main" className="container-site pt-4 pb-6">
          <NavLinks items={items} variant="panel" />
          {resumeHref ? (
            <a href={resumeHref} download="Ehjay-Lorenzo-Resume.pdf" className="label-mono mt-6 flex h-12 items-center justify-between border border-text-3 px-4 text-text">
              Download résumé (PDF)
              <span aria-hidden="true">↓</span>
            </a>
          ) : null}
          <Link href={hireHref(pathname)} className="label-mono mt-6 flex h-12 items-center justify-between bg-accent px-4 text-accent-ink">
            Hire me
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
