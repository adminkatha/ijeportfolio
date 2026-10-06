/*
 * The motion preference: data-motion="reduced" | "full" on <html>.
 * MotionScript sets it before first paint (saved choice, else the OS setting); the palette's
 * "Toggle motion" saves an explicit choice; MotionRoot follows the OS setting while none is saved.
 */

export type Motion = "reduced" | "full";

export const MOTION_KEY = "motion";
const QUERY = "(prefers-reduced-motion: reduce)";

const html = () => document.documentElement;

export function getMotion(): Motion {
  return html().getAttribute("data-motion") === "reduced" ? "reduced" : "full";
}

/** The explicitly saved choice, or null when the site follows the OS setting. */
export function savedMotion(): Motion | null {
  try {
    const value = localStorage.getItem(MOTION_KEY);
    return value === "reduced" || value === "full" ? value : null;
  } catch {
    return null;
  }
}

export const systemMotion = (): Motion => (matchMedia(QUERY).matches ? "reduced" : "full");

/** Applies a choice immediately and remembers it. */
export function setMotion(motion: Motion) {
  html().setAttribute("data-motion", motion);
  try {
    localStorage.setItem(MOTION_KEY, motion);
  } catch {
    // Storage blocked: the choice still applies to this page.
  }
}

export function toggleMotion(): Motion {
  const next: Motion = getMotion() === "reduced" ? "full" : "reduced";
  setMotion(next);
  return next;
}

/** Calls back whenever data-motion changes. */
export function subscribeMotion(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(html(), { attributes: true, attributeFilter: ["data-motion"] });
  return () => observer.disconnect();
}

/** While no choice is saved, keep data-motion in step with the OS setting. */
export function followSystemMotion(): () => void {
  const mq = matchMedia(QUERY);
  const sync = () => {
    if (savedMotion() === null) html().setAttribute("data-motion", systemMotion());
  };
  mq.addEventListener("change", sync);
  return () => mq.removeEventListener("change", sync);
}
