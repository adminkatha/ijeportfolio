/*
 * Pure seam math for the CREATIVE | CODE hero (no DOM, no React).
 * Every value is a percent of the hero's measured width. HeroSeam.tsx feeds every input
 * (pointer, drag, keys, intro) through `clampSeam`, and every derived opacity through `clamp01`.
 */

export const SEAM_MIN = 8;
export const SEAM_MAX = 92;
/** Where the seam rests (and where the intro lands). */
export const SEAM_REST = 50;
/** The intro starts with the finished ad almost whole, then reveals its structure. */
export const SEAM_INTRO_FROM = 92;

/** Arrow keys move 1%, Page keys 10%. */
export const KEY_STEP = 1;
export const PAGE_STEP = 10;

/** Damping time constants (ms): the seam covers ~63% of the remaining distance per tau. */
export const TAU_FOLLOW = 110;
export const TAU_KEYS = 70;
export const TAU_INTRO = 95;

/** Close enough to stop the loop (in %, about 0.3px on a 1440px hero). */
export const SETTLE_EPSILON = 0.02;

/** How far (in %) from its clamp a side's labels take to fade out completely. */
const FADE_SPAN = 14;

export type SeamMode = "follow" | "drag" | "toggle";
export type SeamBox = { left: number; width: number };

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Any input → 8–92. Non-finite input falls back to the rest position. */
export const clampSeam = (value: number) => clamp(Number.isFinite(value) ? value : SEAM_REST, SEAM_MIN, SEAM_MAX);

/** Any derived opacity → 0–1. */
export const clamp01 = (value: number) => clamp(Number.isFinite(value) ? value : 0, 0, 1);

/** Pointer x → seam %. A pointer outside the box pins to the nearest edge (then to the clamp). */
export function seamFromPointer(clientX: number, box: SeamBox): number {
  if (!(box.width > 0)) return SEAM_REST;
  return clampSeam(((clientX - box.left) / box.width) * 100);
}

/**
 * Frame-rate-independent exponential damping: the same motion at 30, 60 or 144 Hz.
 * Covers 1 - e^(-dt/tau) of the remaining distance in dt milliseconds.
 */
export function damp(current: number, target: number, dtMs: number, tauMs: number): number {
  if (!(tauMs > 0)) return target;
  const k = 1 - Math.exp(-clamp(dtMs, 0, 1000) / tauMs);
  return current + (target - current) * k;
}

export const isSettled = (current: number, target: number) => Math.abs(target - current) < SETTLE_EPSILON;

/** The side labels fade as their side shrinks toward its clamp. Always 0–1. */
export function sideOpacities(seam: number): { creative: number; code: number } {
  const s = clampSeam(seam);
  return {
    creative: clamp01((s - SEAM_MIN) / FADE_SPAN),
    code: clamp01((SEAM_MAX - s) / FADE_SPAN),
  };
}

/** Slider keys (WAI-ARIA slider pattern) → the new value, or null for keys the slider ignores. */
export function seamFromKey(key: string, value: number): number | null {
  const v = Math.round(value);
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return clampSeam(v - KEY_STEP);
    case "ArrowRight":
    case "ArrowUp":
      return clampSeam(v + KEY_STEP);
    case "PageDown":
      return clampSeam(v - PAGE_STEP);
    case "PageUp":
      return clampSeam(v + PAGE_STEP);
    case "Home":
      return SEAM_MIN;
    case "End":
      return SEAM_MAX;
    default:
      return null;
  }
}

/** ≥768 with a fine pointer (and motion allowed) follows the cursor; ≥768 otherwise drags; <768 toggles. */
export function seamMode({ wide, fine, reduced }: { wide: boolean; fine: boolean; reduced: boolean }): SeamMode {
  if (!wide) return "toggle";
  return fine && !reduced ? "follow" : "drag";
}

/** "Creative 62%, code 38%" for aria-valuetext. */
export function seamValueText(seam: number): string {
  const c = Math.round(clampSeam(seam));
  return `Creative ${c}%, code ${100 - c}%`;
}
