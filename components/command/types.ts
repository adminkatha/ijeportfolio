export type CommandGroup = "Navigate" | "Work" | "Links" | "Actions";

/** "open-contact": closes the palette, then opens the "Let’s connect" pop-up. */
export type CommandAction = "copy-email" | "toggle-motion" | "open-contact";

export type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  /** Short secondary text on the right (e.g. the discipline, "Sample campaign"). */
  hint?: string;
  /** Extra search terms. */
  keywords?: string[];
} & (
  | { kind: "link"; href: string; external?: boolean; download?: boolean }
  /** `value` carries the action's data, e.g. the address for copy-email. */
  | { kind: "action"; action: CommandAction; value?: string }
);
