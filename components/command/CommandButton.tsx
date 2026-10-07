"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { openContactDialog } from "@/lib/contact/dialog";
import s from "./CommandButton.module.css";
import type { PaletteProps } from "./CommandPalette";
import type { CommandItem } from "./types";

type Palette = ComponentType<PaletteProps>;
export type Typed = { text: string; submit: boolean };
/** "contact": the "Let’s connect" command; the contact pop-up opens once the palette is closed. */
export type CloseReason = "dismiss" | "action" | "navigate" | "contact";

const noSubscribe = () => () => {};
const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** The palette (and cmdk) load on demand: first open, or a hover/focus on the button. */
let palettePromise: Promise<Palette> | null = null;
const loadPalette = () => (palettePromise ??= import("./CommandPalette").then((m) => m.CommandPalette));

/**
 * Header button + global ⌘K / Ctrl+K. Opens the command palette, which is code-split and loaded on demand,
 * and owns the polite live region that confirms its actions ("Email address copied").
 */
export function CommandButton({ items }: { items: CommandItem[] }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  // Bumped on every open, so reopening right after Esc (before the dialog's close event lands) still opens.
  const [session, setSession] = useState(0);
  const [Palette, setPalette] = useState<Palette | null>(null);
  const [message, setMessage] = useState("");
  const apple = useSyncExternalStore(noSubscribe, isApple, () => false);

  const show = useCallback((opener: Element | null) => {
    openerRef.current = opener instanceof HTMLElement && opener !== document.body ? opener : buttonRef.current;
    setOpen(true);
    setSession((n) => n + 1);
    void loadPalette().then((P) => setPalette(() => P));
  }, []);

  const close = useCallback((reason: CloseReason) => {
    setOpen(false);
    // Navigation moves focus to where it lands; everything else returns it to the opener.
    if (reason !== "navigate") openerRef.current?.focus({ preventScroll: true });
    // The pop-up hands focus back to wherever the palette just left it (normally this button).
    if (reason === "contact") openContactDialog(document.activeElement);
  }, []);

  // ⌘K / Ctrl+K anywhere toggles the palette (attached once). "Open" is read from the DOM, not state,
  // so a quick Esc then ⌘K can't race React's update.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.isComposing) return;
      e.preventDefault();
      if (e.target instanceof Element && e.target.closest("dialog[open]")) close("dismiss");
      else show(document.activeElement);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, close]);

  // The first open waits for the palette's chunk: keep what is typed meanwhile (and an Enter) and hand it over.
  const typed = useRef<Typed>({ text: "", submit: false });
  useEffect(() => {
    if (!open || Palette) return;
    typed.current = { text: "", submit: false };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = typed.current;
      if (e.key === "Escape") return close("dismiss");
      if (e.key === "Enter") t.submit = true;
      else if (e.key.length === 1) t.text += e.key;
      else if (e.key === "Backspace") t.text = t.text.slice(0, -1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, Palette, close]);
  const takeTyped = useCallback(() => typed.current, []);

  // The confirmation stays readable for a few seconds, then clears.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const prefetch = () => void loadPalette();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`label-mono ${s.button}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={(e) => show(e.currentTarget)}
        onPointerEnter={prefetch}
        onFocus={prefetch}
      >
        <span>Jump to</span>
        <kbd className={s.kbd} aria-hidden="true">
          {apple ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      <p role="status" className={s.status} data-visible={message ? "" : undefined}>
        {message}
      </p>
      {Palette ? <Palette open={open} session={session} items={items} onClose={close} onAnnounce={setMessage} takeTyped={takeTyped} /> : null}
    </>
  );
}
