export type CommandGroup = "Navigate" | "Work" | "Links" | "Actions";

export type CommandItem = {
  id: string;
  group: CommandGroup;
  label: string;
  hint?: string;
  keywords?: string[];
} & (
  | { kind: "link"; href: string; external?: boolean; download?: boolean }
  | { kind: "action"; action: "copy-email" | "toggle-motion" }
);
