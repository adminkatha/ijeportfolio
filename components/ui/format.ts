// Deterministic date formatting (no locale APIs, so server and client always agree).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "2024-03" → "Mar 2024". Anything else is returned unchanged. */
export function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : value;
}

/** "2026-10-06" → "6 Oct 2026". Anything else is returned unchanged. */
export function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return value;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${Number(m[3])} ${month} ${m[1]}` : value;
}

/** Zero-padded two-digit index: 1 → "01". */
export const pad2 = (n: number) => String(n).padStart(2, "0");
