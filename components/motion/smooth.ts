/*
 * Lenis smooth scrolling, desktop only: a fine pointer, ≥1024px and motion on. Loaded on demand,
 * driven by our own requestAnimationFrame loop that sleeps whenever Lenis isn't animating
 * (zero frames at rest), and torn down as soon as any condition stops holding.
 * Lenis only smooths wheel input; keyboard, scrollbar and touch scrolling stay native.
 */
import type LenisType from "lenis";
import { getMotion, subscribeMotion } from "./preference";
import { registerScroller, scrollToHash } from "./scroll";

const DESKTOP = "(pointer: fine) and (min-width: 1024px)";

export function startSmoothScroll(): () => void {
  const desktop = matchMedia(DESKTOP);
  let lenis: LenisType | null = null;
  let loading = false;
  let disposed = false;
  let teardown: (() => void) | null = null;

  const start = async () => {
    loading = true;
    const { default: Lenis } = await import("lenis");
    loading = false;
    // Conditions may have flipped (even twice) while it loaded: decide on how things stand now.
    if (disposed || lenis || !wanted()) return;

    const instance = new Lenis({ autoRaf: false, anchors: false, stopInertiaOnNavigate: true });
    lenis = instance;

    // Our own clock: it only advances while the loop runs, so waking up never jumps.
    let raf = 0;
    let last = 0;
    let clock = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(now - last, 64) : 1000 / 60;
      last = now;
      clock += dt;
      instance.raf(clock);
      if (instance.isScrolling === "smooth") raf = requestAnimationFrame(tick);
      else last = 0; // asleep until the next wheel or scrollTo
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const offInput = instance.on("virtual-scroll", wake);
    const unregister = registerScroller((target, offset) => {
      instance.scrollTo(target, { offset: -offset });
      wake();
    });

    // In-page anchors: Lenis' scrollTo below the sticky header (Next <Link>s handle their own clicks).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      if (scrollToHash(url.hash)) e.preventDefault();
    };
    document.addEventListener("click", onClick);

    teardown = () => {
      document.removeEventListener("click", onClick);
      unregister();
      offInput();
      if (raf) cancelAnimationFrame(raf);
      instance.destroy();
      lenis = null;
    };
  };

  const stop = () => {
    teardown?.();
    teardown = null;
  };

  const wanted = () => desktop.matches && getMotion() !== "reduced";
  const update = () => {
    if (wanted()) {
      if (!lenis && !loading) void start();
    } else {
      stop();
    }
  };

  update();
  desktop.addEventListener("change", update);
  const unsubscribe = subscribeMotion(update);

  return () => {
    disposed = true;
    desktop.removeEventListener("change", update);
    unsubscribe();
    stop();
  };
}
