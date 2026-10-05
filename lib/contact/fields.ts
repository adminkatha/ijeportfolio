/*
 * Contact form: names, limits and the state shape shared by the form (client) and the server action.
 * Client-safe: no zod, no node modules, no env access. Validation lives in ./schema.ts (server).
 */

/** id of the <form>; the no-JS fallback posts to `<path>#contact-form` so the browser lands back on it. */
export const CONTACT_FORM_ID = "contact-form";

export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  messageMin: 10,
  messageMax: 5000,
  /** The "page" field: a path on this site. */
  page: 200,
} as const;

export const INQUIRY_TYPES = [
  { value: "hire", label: "Hire full-time" },
  { value: "freelance", label: "Freelance project" },
  { value: "other", label: "Other" },
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];
export const INQUIRY_VALUES = INQUIRY_TYPES.map((t) => t.value) as [InquiryType, ...InquiryType[]];
export const inquiryLabel = (value: InquiryType): string => INQUIRY_TYPES.find((t) => t.value === value)?.label ?? value;

/** The visible fields, in DOM order (the first one with an error gets focus). */
export const CONTACT_FIELDS = ["name", "email", "company", "inquiryType", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

/** Hidden fields: the honeypot (must stay empty), the signed start time, and the page the visitor came from. */
export const HONEYPOT_FIELD = "website";
export const TOKEN_FIELD = "t";
export const PAGE_FIELD = "page";

export const PRIVACY_NOTE = "Your details go only to Ehjay and are used to reply.";

export type ContactStatus = "idle" | "invalid" | "retry" | "success" | "error";

/** What the server action returns. Only what the form renders; never the secret or the webhook URL. */
export type ContactState = {
  status: ContactStatus;
  /** Form-level message for the live region. */
  message?: string;
  /** Show the "email me instead" link with the message. */
  offerEmail?: boolean;
  errors?: Partial<Record<ContactField, string>>;
  /** The submitted values, echoed back so nothing typed is lost on an error (the form resets to them). */
  values?: Partial<Record<ContactField, string>>;
  /** Signed start time to use for the next attempt. */
  token?: string;
  /** The page the visitor came from, carried forward when JavaScript is off. */
  page?: string;
};

export const initialContactState: ContactState = { status: "idle" };

/** A safe path on this site ("/work/x"), or null. Rejects other origins ("//x", "https://x"), whitespace and control characters. */
export function sanitizePath(input: string | null | undefined): string | null {
  if (!input) return null;
  const path = input.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return null;
  if (path.length > CONTACT_LIMITS.page) return null;
  if (/[\s\u0000-\u001f\u007f-\u009f]/.test(path)) return null;
  return path;
}

/** Browser only: the `from` query parameter when it's a safe path, otherwise the current path. */
export function pageFromLocation(): string {
  const from = sanitizePath(new URLSearchParams(window.location.search).get("from"));
  return from ?? window.location.pathname;
}
