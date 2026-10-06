"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const QUERY = "(min-width: 768px)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

/**
 * From 768px: the live demo in a lazy, sandboxed iframe. Below that (and before hydration, and without JS):
 * the preview passed as children, as a shortcut to the full-screen demo. The iframe is never rendered on
 * phones, because Chrome may load a lazy iframe that is merely hidden with CSS.
 */
export function DemoEmbed({ src, title, children }: { src: string; title: string; children: ReactNode }) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  return wide ? (
    <iframe src={src} title={title} loading="lazy" sandbox="allow-scripts" className="absolute inset-0 block size-full" />
  ) : (
    // A pointer shortcut only: the labelled "Open full screen" link is the keyboard and screen-reader route.
    <a href={src} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="absolute inset-0 block">
      {children}
    </a>
  );
}
