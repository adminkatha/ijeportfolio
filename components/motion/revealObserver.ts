/*
 * Reveal once: one shared IntersectionObserver for every [data-reveal] element on the page
 * (including ones added later by client-side navigation). CSS in motion.css does the animation.
 */
import { getMotion, subscribeMotion } from "./preference";

const PENDING = "[data-reveal]:not([data-revealed])";

export function startReveals(): () => void {
  const html = document.documentElement;
  const reveal = (el: Element) => el.setAttribute("data-revealed", "");

  const io = new IntersectionObserver(
    (entries) => {
      let shown = false;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        io.unobserve(entry.target); // once
        shown = true;
      }
      // A jump (End, an anchor, a fast fling) can carry a block from below the screen to above it
      // without it ever intersecting; anything already scrolled past is shown too (it is off-screen).
      if (!shown) return;
      document.querySelectorAll(PENDING).forEach((el) => {
        if (el.getBoundingClientRect().bottom > 0) return;
        reveal(el);
        io.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );

  const scan = () => {
    const pending = document.querySelectorAll(PENDING);
    if (getMotion() === "reduced") pending.forEach(reveal);
    else pending.forEach((el) => io.observe(el));
  };

  scan();
  html.setAttribute("data-reveal-ready", ""); // stands down the CSS failsafe

  // New sections (client-side navigation) join the same observer; mutations are batched per microtask.
  let queued = false;
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      scan();
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // Motion switched off: show whatever is still waiting, right away.
  const unsubscribe = subscribeMotion(() => {
    if (getMotion() === "reduced") document.querySelectorAll(PENDING).forEach(reveal);
  });

  return () => {
    io.disconnect();
    mo.disconnect();
    unsubscribe();
  };
}
