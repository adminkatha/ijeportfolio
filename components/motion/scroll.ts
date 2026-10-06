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

/** Room for the sticky header: the --header-h custom property if the layout sets one, else 80px. */
export function headerOffset(): number {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h"));
  return Number.isFinite(value) && value > 0 ? value : 80;
}

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex]";

/** Scrolls to `#id` on this page. Returns false if there is no such element. */
export function scrollToHash(hash: string): boolean {
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  const target = id ? document.getElementById(id) : null;
  if (!target) return false;
  if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
  const offset = headerOffset();
  if (scroller) {
    scroller(target, offset);
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
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
