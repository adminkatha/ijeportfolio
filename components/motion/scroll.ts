/*
 * In-page navigation shared by the command palette and MotionRoot's anchor handling:
 * scrolls to a section below the sticky header, updates the URL hash and moves focus there.
 * When Lenis is running (desktop, motion on), MotionRoot registers it as the scroller.
 */
import { getMotion } from "./preference";

type Scroller = (target: HTMLElement, offset: number) => void;
let scroller: Scroller | null = null;

/** MotionRoot hands in Lenis' scrollTo; returns an unregister function. */
export function registerScroller(fn: Scroller): () => void {
  scroller = fn;
  return () => {
    if (scroller === fn) scroller = null;
  };
}

/** The root's scroll-padding-top in px (the layout sets it to the sticky header plus a little room). */
function rootScrollPadding(): number {
  const value = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Where in-page targets land below the top of the viewport: the root's scroll-padding-top, so palette and
 * Lenis jumps land exactly where native anchor jumps do. 80px if the layout sets none.
 * (Read as computed px: --header-h is in rem, so parsing it directly would give 4, not 64.)
 */
export function headerOffset(): number {
  const padding = rootScrollPadding();
  return padding > 0 ? padding : 80;
}

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

/** Scrolls to `#id` on this page. Returns false if there is no such element. */
export function scrollToHash(hash: string): boolean {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = id ? document.getElementById(id) : null;
  if (!target) return false;
  if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
  if (scroller) {
    // Lenis already subtracts the root's scroll-padding-top; pass only what it doesn't know about.
    scroller(target, headerOffset() - rootScrollPadding());
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: getMotion() === "reduced" ? "auto" : "smooth" });
  }
  // Keyboard and screen-reader users continue from the section they jumped to.
  if (!target.matches(FOCUSABLE)) {
    target.setAttribute("tabindex", "-1");
    target.setAttribute("data-scroll-target", ""); // motion.css: no focus ring around a whole section
  }
  target.focus({ preventScroll: true });
  return true;
}
