"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getMotion, subscribeMotion, toggleMotion } from "@/components/motion/preference";
import { scrollToHash } from "@/components/motion/scroll";
import "@/components/motion/motion.css";
import type { CloseReason, Typed } from "./CommandButton";
import s from "./CommandPalette.module.css";
import type { CommandGroup, CommandItem } from "./types";

export type PaletteProps = {
  open: boolean;
  /** Changes on every open request. */
  session: number;
  items: CommandItem[];
  onClose: (reason: CloseReason) => void;
  onAnnounce: (message: string) => void;
  /** Whatever was typed while the palette was still loading (first open only). */
  takeTyped: () => Typed;
};

const GROUPS: CommandGroup[] = ["Navigate", "Work", "Links", "Actions"];

const norm = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/['‘’]/g, "") // "lets", "let's" and "let’s" all find "Let’s connect"
    .replace(/\s+/g, " ")
    .trim();
const words = (text: string) => text.split(/[^\p{L}\p{N}@.]+/u).filter(Boolean);

/**
 * How well an item matches the query (0 = hidden). Prefix and word matches only: cmdk's default
 * fuzzy scoring lets "toggle" match scattered letters in a project's keywords.
 */
function score(label: string, terms: string[], query: string): number {
  const name = norm(label);
  if (name === query) return 1;
  if (name.startsWith(query)) return 0.9;
  if (words(name).some((w) => w.startsWith(query))) return 0.8;
  if (name.includes(query)) return 0.7;
  const haystack = norm([label, ...terms].join(" "));
  const all = words(haystack);
  if (query.split(" ").every((part) => all.some((w) => w.startsWith(part)))) return 0.5;
  return haystack.includes(query) ? 0.4 : 0;
}

/**
 * The command palette (loaded on demand by CommandButton). A native modal <dialog>: the page behind
 * is inert (focus stays inside), Esc closes it, and focus goes back to whatever opened it.
 * cmdk provides the combobox + listbox semantics, filtering and arrow-key selection.
 */
export function CommandPalette({ open, session, items, onClose, onAnnounce, takeTyped }: PaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reason = useRef<CloseReason>("dismiss");
  const [early] = useState(takeTyped);
  const [search, setSearch] = useState(early.text);
  const router = useRouter();
  const motion = useSyncExternalStore(subscribeMotion, getMotion, () => "full");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      reason.current = "dismiss";
      dialog.showModal();
      // cmdk's root and list are tabindex=-1, so point the dialog's initial focus at the input.
      dialog.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, session]);

  // Labels double as cmdk values, so they must be unique.
  const groups = useMemo(() => {
    const seen = new Set<string>();
    return GROUPS.map((group) => ({
      group,
      items: items
        .filter((item) => item.group === group)
        .map((item) => {
          const value = seen.has(item.label) ? `${item.label} (${item.group})` : item.label;
          seen.add(item.label);
          return { item, value, terms: [item.hint ?? "", ...(item.keywords ?? [])] };
        }),
    })).filter((g) => g.items.length > 0);
  }, [items]);

  // Filtering and ranking are ours (cmdk's shouldFilter is off): best matches first, and the
  // group holding the best match moves up. With no query, the content order stands.
  const results = useMemo(() => {
    const query = norm(search);
    if (!query) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items
          .map((entry) => ({ ...entry, score: score(entry.item.label, entry.terms, query) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score),
      }))
      .filter((g) => g.items.length > 0)
      .sort((a, b) => b.items[0]!.score - a.items[0]!.score);
  }, [groups, search]);

  const close = (why: CloseReason) => {
    reason.current = why;
    dialogRef.current?.close();
  };

  const run = (item: CommandItem) => {
    if (item.kind === "action") {
      if (item.action === "copy-email") {
        const address = item.value ?? "";
        // Called inside the keypress/click, while the browser still allows clipboard access.
        const copied = navigator.clipboard?.writeText(address) ?? Promise.reject(new Error("no clipboard"));
        close("action");
        copied.then(
          () => onAnnounce(`Email address copied: ${address}`),
          () => onAnnounce(`Couldn't copy. The address is ${address}`),
        );
      } else if (item.action === "open-contact") {
        // CommandButton opens the pop-up once the palette has closed and focus is back on its opener.
        close("contact");
      } else {
        const next = toggleMotion();
        close("action");
        onAnnounce(next === "reduced" ? "Motion reduced" : "Motion on");
      }
      return;
    }
    const url = new URL(item.href, location.href);
    if (item.download) {
      close("action");
      const a = document.createElement("a");
      a.href = url.href;
      a.download = "";
      a.click();
    } else if (item.external) {
      close("action");
      window.open(url.href, "_blank", "noopener,noreferrer");
    } else if (url.protocol === "mailto:") {
      close("action");
      window.location.assign(url.href);
    } else if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
      close("navigate");
      scrollToHash(url.hash);
    } else {
      close("navigate");
      router.push(`${url.pathname}${url.search}${url.hash}`);
    }
  };

  // An Enter pressed before the palette had loaded opens the top result (once).
  const submitted = useRef(false);
  const submitEarly = useEffectEvent(() => {
    const first = results[0]?.items[0]?.item;
    if (!early.submit || !first || submitted.current) return;
    submitted.current = true;
    run(first);
  });
  useEffect(() => submitEarly(), []);

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-label="Command menu"
      data-lenis-prevent=""
      onClose={() => {
        // The close event arrives a task later: if the palette was reopened meanwhile, it is stale.
        if (dialogRef.current?.open) return;
        setSearch("");
        onClose(reason.current);
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the <dialog> itself.
        if (e.target === e.currentTarget) close("dismiss");
      }}
    >
      {/* cmdk labels its input with this (aria-labelledby), so it names the search field. */}
      <Command label="Search commands" className={s.command} loop shouldFilter={false} vimBindings={false}>
        <div className={s.head}>
          <Command.Input
            value={search}
            onValueChange={setSearch}
            className={s.input}
            placeholder="Jump to a section, a project, or an action…"
          />
          <kbd className={`label-mono ${s.esc}`} aria-hidden="true">
            Esc
          </kbd>
        </div>
        <Command.List className={s.list} label="Commands">
          <Command.Empty className={s.empty}>Nothing matches “{search}”.</Command.Empty>
          {results.map(({ group, items: list }) => (
            <Command.Group key={group} heading={group} className={s.group}>
              {list.map(({ item, value }) => (
                <Command.Item key={item.id} value={value} onSelect={() => run(item)} className={s.item}>
                  <span className={s.label}>
                    {item.label}
                    {item.kind === "link" && item.external ? <span aria-hidden="true"> ↗</span> : null}
                  </span>
                  {item.kind === "action" && item.action === "toggle-motion" ? (
                    <span className={s.hint}>{motion === "reduced" ? "Off" : "On"}</span>
                  ) : item.hint ? (
                    <span className={s.hint}>{item.hint}</span>
                  ) : null}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
        <p className={`label-mono ${s.foot}`} aria-hidden="true">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>esc close</span>
        </p>
      </Command>
    </dialog>
  );
}
