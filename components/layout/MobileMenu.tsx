"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { NavItem } from "./nav";
import { NavLinks } from "./NavLinks";

/**
 * The menu under 768px: a native <details> disclosure, so it opens with Enter/Space and works without JS.
 * Enhancements: Esc closes it and returns focus to the button; it closes when a link is chosen, when focus
 * or a tap leaves it, on navigation, and when the viewport grows past 768px.
 */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const summary = details.querySelector("summary");
    const close = () => {
      details.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && details.open) {
        close();
        summary?.focus();
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (details.open && e.relatedTarget instanceof Node && !details.contains(e.relatedTarget)) close();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (details.open && e.target instanceof Node && !details.contains(e.target)) close();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a")) close();
    };
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (wide.matches) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    details.addEventListener("focusout", onFocusOut);
    details.addEventListener("click", onClick);
    wide.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      details.removeEventListener("focusout", onFocusOut);
      details.removeEventListener("click", onClick);
      wide.removeEventListener("change", onWide);
    };
  }, []);

  return (
    <details ref={ref} className="group md:hidden">
      <summary className="label-mono flex h-11 min-w-11 cursor-pointer items-center gap-2.5 border border-text-3 px-3 text-text select-none">
        Menu
        <span aria-hidden="true" className="relative block h-2.5 w-3.5">
          <span className="absolute inset-x-0 top-0 h-px bg-current transition-transform duration-(--dur-1) ease-out group-open:translate-y-[4.5px] group-open:rotate-45" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-(--dur-1) ease-out group-open:-translate-y-[4.5px] group-open:-rotate-45" />
        </span>
      </summary>
      <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--header-h))] overflow-y-auto border-b border-line bg-bg bg-[url(/grain.png)]">
        <nav aria-label="Main" className="container-site pt-4 pb-6">
          <NavLinks items={items} variant="panel" />
          <Link
            href="/#contact"
            className="label-mono mt-6 flex h-12 items-center justify-between bg-accent px-4 text-accent-ink"
          >
            Hire me
            <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </details>
  );
}
