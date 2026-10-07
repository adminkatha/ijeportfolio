/*
 * The "Let’s connect" pop-up: open requests and its on-demand chunk. Client-safe and tiny, so any
 * "Let’s connect" control (header, mobile menu, palette) can use it without pulling in the form.
 * components/contact/ContactDialogHost (mounted once in the root layout) listens and renders the dialog.
 */

type Listener = (opener: HTMLElement | null) => void;
const listeners = new Set<Listener>();

/** The dialog and the form load on demand: the first open, or a hover/focus on a "Let’s connect" link. */
let chunk: Promise<typeof import("@/components/contact/ContactDialog")> | null = null;
export const loadContactDialog = () =>
  (chunk ??= import("@/components/contact/ContactDialog").catch((error: unknown) => {
    chunk = null; // a failed load (offline, a new deploy) is retried next time
    throw error;
  }));
export const prefetchContactDialog = () => void loadContactDialog().catch(() => {});

/**
 * Asks the host to open the pop-up; on close, focus goes back to `opener`. Returns false when no host is
 * listening (not hydrated yet), so a link can fall back to its href.
 */
export function openContactDialog(opener: Element | null): boolean {
  const target = opener instanceof HTMLElement && opener !== document.body ? opener : null;
  listeners.forEach((listener) => listener(target));
  return listeners.size > 0;
}

/** The host subscribes here; returns an unsubscribe function. */
export function onOpenContactDialog(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
