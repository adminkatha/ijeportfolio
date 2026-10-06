"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

/**
 * Sends clicks on any element with a `data-event="name"` attribute to Vercel Analytics as custom events
 * (e.g. the hero CTA, `data-event="hero_cta"`: the "tracked link" the hero's CODE side shows).
 * One delegated listener; rendered only on Vercel, inside <VercelInsights />.
 */
export function TrackEvents() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-event]");
      const name = el?.getAttribute("data-event");
      if (name) track(name, { path: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
