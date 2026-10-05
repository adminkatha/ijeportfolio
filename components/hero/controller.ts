/*
 * The seam controller: wires pointer, drag, keys and the intro to the hero's --seam.
 * Plain DOM (no React state), so moving the seam never re-renders anything.
 *
 *  - Every source goes through setSeam(), which clamps to 8–92% (seam.ts).
 *  - One rAF loop with time-based damping; it stops as soon as the seam settles
 *    (zero callbacks at rest) and restarts on the next input.
 *  - Geometry is the hero's box, cached and refreshed by a ResizeObserver; nothing
 *    measures layout on pointer moves.
 *  - Modes follow matchMedia change listeners in both directions, plus the site's
 *    motion setting (data-motion on <html>). All listeners are attached once.
 */
import {
  SEAM_REST,
  SETTLE_EPSILON,
  TAU_FOLLOW,
  TAU_INTRO,
  TAU_KEYS,
  clampSeam,
  damp,
  isSettled,
  seamFromKey,
  seamFromPointer,
  seamMode,
  seamValueText,
  sideOpacities,
  type SeamBox,
  type SeamMode,
} from "./seam";

const INTRO_MS = 800;

export function attachSeam(root: HTMLElement, knob: HTMLElement): () => void {
  const html = document.documentElement;
  const wide = matchMedia("(min-width: 768px)");
  const fine = matchMedia("(pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  let seam = SEAM_REST; // what is on screen
  let target = SEAM_REST; // where it is heading
  let rest = SEAM_REST; // the slider's value: where the seam returns when the cursor leaves
  let tau = TAU_FOLLOW;
  let mode: SeamMode | null = null;
  let reduced = false;
  let box: SeamBox = { left: 0, width: 0 };
  let raf = 0;
  let last = 0;
  let hovering = false;
  let drag: { id: number; grab: number } | null = null;
  const written = { seam: "", creative: "", code: "" };

  // ── Output ──────────────────────────────────────────────────────────────────

  const write = (prop: "--seam" | "--o-creative" | "--o-code", key: keyof typeof written, value: string) => {
    if (written[key] === value) return;
    written[key] = value;
    root.style.setProperty(prop, value);
  };

  const render = () => {
    write("--seam", "seam", `${seam.toFixed(3)}%`);
    const o = sideOpacities(seam); // each clamped 0–1
    write("--o-creative", "creative", o.creative.toFixed(3));
    write("--o-code", "code", o.code.toFixed(3));
  };

  const announce = (value: number) => {
    const now = String(Math.round(clampSeam(value)));
    if (knob.getAttribute("aria-valuenow") === now) return;
    knob.setAttribute("aria-valuenow", now);
    knob.setAttribute("aria-valuetext", seamValueText(value));
  };

  // ── The loop ────────────────────────────────────────────────────────────────

  const tick = (now: number) => {
    raf = 0;
    const dt = last ? now - last : 1000 / 60;
    last = now;
    seam = damp(seam, target, dt, tau);
    const settled = isSettled(seam, target);
    if (settled) seam = target;
    render();
    if (settled) {
      last = 0;
      announce(seam);
      return; // asleep until the next input
    }
    raf = requestAnimationFrame(tick);
  };

  const halt = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };

  /** The single entry point for pointer, drag, keys and the intro. `damping` is tau in ms (0 = next frame). */
  const setSeam = (value: number, damping: number) => {
    target = clampSeam(value);
    tau = reduced ? 0 : damping;
    if (isSettled(seam, target)) {
      if (seam !== target) {
        seam = target;
        render();
      }
      if (!raf) announce(seam);
      return;
    }
    if (!raf) raf = requestAnimationFrame(tick);
  };

  // ── Geometry (cached) ───────────────────────────────────────────────────────

  const measure = () => {
    const r = root.getBoundingClientRect();
    box = { left: r.left + window.scrollX, width: r.width };
  };
  const pointerSeam = (clientX: number) => seamFromPointer(clientX + window.scrollX, box);

  // ── Modes ───────────────────────────────────────────────────────────────────

  const endDrag = () => {
    if (!drag) return;
    const { id } = drag;
    drag = null;
    delete root.dataset.dragging;
    if (knob.hasPointerCapture(id)) knob.releasePointerCapture(id);
    rest = target;
    announce(target);
  };

  const update = () => {
    reduced = reduce.matches || html.dataset.motion === "reduced";
    const next = seamMode({ wide: wide.matches, fine: fine.matches, reduced });
    if (next !== mode) {
      mode = next;
      root.dataset.mode = mode;
      if (mode === "toggle") {
        // The split isn't drawn under 768px: park the seam at rest without animating.
        endDrag();
        hovering = false;
        halt();
        seam = target = rest;
        render();
        announce(seam);
      } else if (mode !== "follow" && hovering) {
        hovering = false;
        setSeam(rest, TAU_FOLLOW);
      }
    }
    // Reduced motion: no easing in flight, ever.
    if (reduced && raf) {
      halt();
      seam = target;
      render();
      announce(seam);
    }
  };

  // ── Intro: the CSS intro runs from first paint; once hydrated, the rest of it goes through setSeam ──

  const adoptIntro = () => {
    const intro = root.getAnimations().find((a) => (a as CSSAnimation).animationName?.includes("seamIntro"));
    if (!intro) {
      root.dataset.intro = "done";
      return;
    }
    const elapsed = Number(intro.currentTime ?? 0);
    seam = clampSeam(parseFloat(getComputedStyle(root).getPropertyValue("--seam")));
    render(); // hold the animated value inline…
    root.dataset.intro = "done"; // …as the CSS animation is removed
    const span = Math.abs(SEAM_REST - seam);
    const remaining = Math.max(1000 / 60, INTRO_MS - elapsed);
    // Settle within what is left of the 800ms budget.
    const t = span > SETTLE_EPSILON ? Math.min(TAU_INTRO, remaining / Math.log(span / SETTLE_EPSILON)) : 0;
    setSeam(SEAM_REST, t);
  };

  // ── Input ───────────────────────────────────────────────────────────────────

  const onEnter = () => measure();

  const onMove = (e: PointerEvent) => {
    if (drag || mode !== "follow" || e.pointerType !== "mouse") return;
    hovering = true;
    setSeam(pointerSeam(e.clientX), TAU_FOLLOW);
  };

  const onLeave = () => {
    if (!hovering || drag) return;
    hovering = false;
    setSeam(rest, TAU_FOLLOW);
  };

  const onKnobDown = (e: PointerEvent) => {
    if (mode === "toggle" || drag || (e.pointerType === "mouse" && e.button !== 0)) return;
    e.preventDefault(); // no text selection; focus is moved by hand below
    knob.setPointerCapture(e.pointerId);
    const seamX = box.left - window.scrollX + (seam / 100) * box.width;
    drag = { id: e.pointerId, grab: e.clientX - seamX };
    root.dataset.dragging = "";
    knob.focus({ preventScroll: true });
  };

  const onKnobMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    setSeam(pointerSeam(e.clientX - drag.grab), 0); // direct: lands on the next frame
  };

  const onKnobUp = (e: PointerEvent) => {
    if (drag && e.pointerId === drag.id) endDrag();
  };

  const onKey = (e: KeyboardEvent) => {
    if (mode === "toggle") return;
    const value = seamFromKey(e.key, target);
    if (value === null) return;
    e.preventDefault();
    rest = value;
    announce(value);
    setSeam(value, TAU_KEYS);
  };

  // ── Wiring (once) ───────────────────────────────────────────────────────────

  measure();
  update();
  if (mode !== "toggle" && !reduced) {
    adoptIntro();
  } else {
    root.dataset.intro = "done";
  }
  // A remount (e.g. React StrictMode in dev) picks up wherever the seam was left.
  if (!raf) {
    const current = parseFloat(getComputedStyle(root).getPropertyValue("--seam"));
    if (Number.isFinite(current)) seam = target = clampSeam(current);
    setSeam(SEAM_REST, TAU_INTRO);
  }

  const ro = new ResizeObserver(measure);
  ro.observe(root);
  const mo = new MutationObserver(update);
  mo.observe(html, { attributes: true, attributeFilter: ["data-motion"] });
  for (const mq of [wide, fine, reduce]) mq.addEventListener("change", update);

  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  knob.addEventListener("pointerdown", onKnobDown);
  knob.addEventListener("pointermove", onKnobMove, { passive: true });
  knob.addEventListener("pointerup", onKnobUp);
  knob.addEventListener("pointercancel", onKnobUp);
  knob.addEventListener("lostpointercapture", onKnobUp);
  knob.addEventListener("keydown", onKey);

  return () => {
    halt();
    ro.disconnect();
    mo.disconnect();
    for (const mq of [wide, fine, reduce]) mq.removeEventListener("change", update);
    root.removeEventListener("pointerenter", onEnter);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    knob.removeEventListener("pointerdown", onKnobDown);
    knob.removeEventListener("pointermove", onKnobMove);
    knob.removeEventListener("pointerup", onKnobUp);
    knob.removeEventListener("pointercancel", onKnobUp);
    knob.removeEventListener("lostpointercapture", onKnobUp);
    knob.removeEventListener("keydown", onKey);
  };
}
