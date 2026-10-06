/*
 * Inline <head> script, run before first paint (render it inside <head> in the root layout,
 * and give <html> `suppressHydrationWarning`, because this script changes its attributes):
 *  - adds the `js` class, so hide-before-reveal styles apply only when JavaScript runs;
 *  - sets data-motion="reduced" | "full" from the saved preference (localStorage "motion"),
 *    falling back to the prefers-reduced-motion media query.
 * Kept in sync with components/motion/preference.ts.
 */
const SCRIPT = `(function(h){h.classList.add("js");var m;try{m=localStorage.getItem("motion")}catch(e){}if(m!=="reduced"&&m!=="full")m=matchMedia("(prefers-reduced-motion: reduce)").matches?"reduced":"full";h.setAttribute("data-motion",m)})(document.documentElement)`;

export function MotionScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
