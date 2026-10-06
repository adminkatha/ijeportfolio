"use client";

import { useEffect } from "react";
import { followSystemMotion } from "./preference";
import { startReveals } from "./revealObserver";
import { startSmoothScroll } from "./smooth";
import "./motion.css";

/**
 * Mounted once in the root layout (inside <body>). Renders nothing; it starts:
 *  - the reveal-once observer (one IntersectionObserver for every <Reveal>),
 *  - Lenis smooth scrolling on desktop only (loaded on demand, idle loop stopped, torn down when
 *    the pointer, the width or the motion setting changes),
 *  - keeping data-motion in step with the OS setting while no explicit choice is saved.
 */
export function MotionRoot() {
  useEffect(() => {
    const stops = [followSystemMotion(), startReveals(), startSmoothScroll()];
    return () => stops.forEach((stop) => stop());
  }, []);
  return null;
}
