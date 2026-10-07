import type { InquiryType } from "./fields";

/*
 * Starter letters for the contact form's message box, one per inquiry type. Client-safe: no zod, no node modules.
 * The form offers the letter for the chosen type; a message that is still an untouched letter is refused, in the
 * browser and on the server (./schema.ts), with UNTOUCHED_LETTER.
 */

export const LETTERS: Record<InquiryType, string> = {
  hire: [
    "Hi Ehjay,",
    "",
    "I came across your portfolio and I'd like to talk to you about a role.",
    "",
    "Role:",
    "Full-time or part-time:",
    "Remote or on-site:",
    "Start date:",
    "Salary range (optional):",
    "",
    "Are you open to a quick call this week?",
  ].join("\n"),
  freelance: [
    "Hi Ehjay,",
    "",
    "I have a project I'd like your help with.",
    "",
    "What I need (ads, videos, a website, a dashboard…):",
    "Timeline:",
    "Budget:",
    "",
    "Can you take this on?",
  ].join("\n"),
  other: "Hi Ehjay,",
};

/** The field error for a message that is still one of the letters, exactly as offered. */
export const UNTOUCHED_LETTER = "Add a few details about the role or project";

/** CRLF → LF, no trailing whitespace on any line, no outer whitespace. */
const normalize = (text: string) =>
  text
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+$/gm, "")
    .trim();

const untouched = new Set(Object.values(LETTERS).map(normalize));

/** True when the message is one of the letters with nothing added (any letter, not only the chosen type's). */
export const isUntouchedLetter = (message: string): boolean => untouched.has(normalize(message));
