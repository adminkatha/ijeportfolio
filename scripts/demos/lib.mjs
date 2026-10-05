// Shared helpers for the dashboard demo pipeline (build.mjs, verify.mjs, privacy-check.mjs).
//
// Sources are the saved pages in DASHBOARD_SRC (default: the ehjay-files folder), matched by
// CLIENT-NAME PREFIX. Their file names are "<Client> · <reporting-app name>.html"; the
// reporting-app name is detected at runtime from those names and never written in this repo.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PUBLIC_DEMOS = path.join(REPO, "public", "demos");
export const SRC_DIR = process.env.DASHBOARD_SRC || "C:/Users/Client/LPT/ehjay-files/dashboards";
export const WORK = process.env.DEMO_WORK || path.join(os.tmpdir(), "dashboard-demos-build");
export const SEP = /\s+\u00b7\s+/; // " · " between client and app name in the saved file names

/** Every saved page: { client, suffix, html, filesDir }. */
export function listSources() {
  if (!fs.existsSync(SRC_DIR)) throw new Error(`Source folder not found: ${SRC_DIR} (set DASHBOARD_SRC)`);
  return fs
    .readdirSync(SRC_DIR)
    .filter((f) => f.endsWith(".html") && SEP.test(f))
    .sort()
    .map((f) => {
      const [client, rest] = f.slice(0, -5).split(SEP);
      return { client: client.trim(), suffix: rest.trim(), html: path.join(SRC_DIR, f), filesDir: path.join(SRC_DIR, f.slice(0, -5) + "_files") };
    });
}

/** The saved page for a client. The plain save is preferred over a numbered duplicate ("· 1"). */
export function findSource(prefix) {
  const all = listSources().filter((s) => s.client.toLowerCase().startsWith(prefix.toLowerCase()));
  const plain = all.filter((s) => !/^\d+$/.test(s.suffix));
  const pick = plain[0] || all[0];
  if (!pick) throw new Error(`No saved page for "${prefix}"`);
  return { ...pick, inner: path.join(pick.filesDir, "saved_resource.html"), duplicates: all.filter((s) => s !== pick) };
}

/** The reporting-app brand, read from the file names: the most common non-numeric suffix. */
export function brandWords() {
  const count = new Map();
  for (const s of listSources()) if (/[a-z]/i.test(s.suffix)) count.set(s.suffix, (count.get(s.suffix) || 0) + 1);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!top) throw new Error("Could not detect the reporting-app name from the source file names");
  return top[0].split(/\s+/).filter(Boolean);
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Any single brand word (global, case-insensitive). */
export const brandWordRe = () => new RegExp(brandWords().map(esc).join("|"), "gi");
/** The joined phrase, with any separator (space, middle dot, dot, dash, underscore). */
export const brandPhraseRe = () => new RegExp(brandWords().map(esc).join("[\\s\\u00b7._-]*"), "i");

export const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
export function dirSize(dir) {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    total += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return total;
}
export function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
