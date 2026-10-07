// Pre-push gate. Run before every `git push`: `pnpm check:push` (exit code 1 = do not push).
//
// Checks the files tracked at HEAD (what a push publishes; the repo is public) for:
//   - .env files (only .env.example may be tracked)
//   - files over 50 MB anywhere in the commits being pushed; videos over 15 MB; videos over 80 MB in total
//   - .screenshots/ not ignored
//   - a banned brand name, Google Sheets / Apps Script URLs, API keys and tokens, ad account IDs
//   - email addresses other than the allow-list, and phone-number patterns in content, docs and demos
//   - demo pages without noindex, or with external scripts/styles

import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const MB = 1024 * 1024;
const failures = [];
const fail = (rule, detail) => failures.push(`${rule}: ${detail}`);

const files = git("ls-files", "-z").split("\0").filter(Boolean);

// 1. env files
for (const f of files) {
  if (/(^|\/)\.env/.test(f) && f !== ".env.example") fail("env file tracked", f);
}

// 2. sizes: tracked files, and every blob in the commits that are not on the remote yet
let range = "--all";
try {
  git("rev-parse", "--verify", "origin/main");
  range = "origin/main..HEAD";
} catch {
  // no remote branch yet: check the whole history
}
const objects = git("rev-list", "--objects", ...(range === "--all" ? ["--all"] : [range]))
  .split("\n")
  .filter(Boolean)
  .map((line) => line.split(" ")[0]);
if (objects.length) {
  const batch = execFileSync("git", ["cat-file", "--batch-check=%(objecttype) %(objectname) %(objectsize)"], {
    input: objects.join("\n"),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  for (const line of batch.split("\n")) {
    const [type, sha, size] = line.split(" ");
    if (type === "blob" && Number(size) > 50 * MB) fail("blob over 50 MB in unpushed commits", `${sha} (${(Number(size) / MB).toFixed(1)} MB)`);
  }
}
let videoTotal = 0;
for (const f of files) {
  const size = statSync(f, { throwIfNoEntry: false })?.size ?? 0;
  if (size > 50 * MB) fail("file over 50 MB", f);
  if (/\.(mp4|webm|mov)$/i.test(f)) {
    videoTotal += size;
    if (size > 15 * MB) fail("video over 15 MB", `${f} (${(size / MB).toFixed(1)} MB)`);
  }
}
if (videoTotal > 80 * MB) fail("videos over 80 MB in total", `${(videoTotal / MB).toFixed(1)} MB`);

// 3. screenshots ignored
try {
  git("check-ignore", "-q", ".screenshots/x.png");
} catch {
  fail(".gitignore", ".screenshots/ is not ignored");
}

// 4–6. content scans on text files
const TEXT = /\.(md|mdx|ts|tsx|js|mjs|cjs|json|css|html|txt|xml|svg|yml|yaml|gs|bat|example)$/i;
const SKIP = new Set(["pnpm-lock.yaml"]);
const BRAND = new RegExp(["agora", "atrium"].join("[\\s\\u00b7·._-]*"), "i"); // assembled so this file never contains the name
// His address (public on the site) and the admin address the contact form CCs (docs/contact/apps-script.gs).
const ALLOWED_EMAILS = new Set(["ehjaylorenzo2@gmail.com", "admin.katha@gmail.com", "noreply@anthropic.com"]);
const SECRET_PATTERNS = [
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["GitHub token", /\bgh[pousr]_[0-9A-Za-z]{30,}/],
  ["Slack token", /\bxox[abprs]-[0-9A-Za-z-]{10,}/],
  ["Stripe key", /\b[sr]k_(live|test)_[0-9A-Za-z]{16,}/],
  ["Meta access token", /\bEAA[A-Za-z0-9]{30,}/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["ad account ID", /\bact_\d{6,}/],
  ["Google Sheets URL", /docs\.google\.com\/spreadsheets\/d\/[A-Za-z0-9_-]{20,}/],
  ["Apps Script deployment URL", /script\.google(usercontent)?\.com\/macros\/s\/[A-Za-z0-9_-]{20,}/],
  ["bearer token", /Bearer\s+[A-Za-z0-9._-]{20,}/],
];
const PHONE = /(?<![\w.#/-])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)\s?|\d{2,4}[\s.-])\d{3,4}[\s.-]\d{3,4}(?![\w.-])/;
const PHONE_SCOPE = /^(content|docs|public\/demos)\//;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

for (const f of files) {
  if (BRAND.test(f)) fail("banned brand in file name", f);
  if (!TEXT.test(f) || SKIP.has(path.basename(f))) continue;
  const text = readFileSync(f, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    const at = `${f}:${i + 1}`;
    if (BRAND.test(line)) fail("banned brand name", at);
    for (const [name, re] of SECRET_PATTERNS) if (re.test(line)) fail(name, at);
    for (const email of line.match(EMAIL) ?? []) {
      const domain = email.split("@")[1].toLowerCase();
      const isAsset = /\.(png|jpe?g|webp|avif|svg|gif|woff2?)$/i.test(email); // e.g. icon@2x.png
      if (!ALLOWED_EMAILS.has(email.toLowerCase()) && !isAsset && !/^example\.(com|org|net)$/.test(domain)) {
        fail("email address", `${at} (${email})`);
      }
    }
    if (PHONE_SCOPE.test(f) && PHONE.test(line)) fail("phone-like number", `${at} (${line.match(PHONE)[0].trim()})`);
  });

  if (/^public\/demos\/.+\.html$/i.test(f)) {
    if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(text)) fail("demo without noindex", f);
    if (/<script[^>]+src=["']https?:/i.test(text)) fail("demo loads an external script", f);
    if (/<link[^>]+href=["']https?:/i.test(text)) fail("demo links an external resource", f);
  }
}

if (failures.length) {
  console.error(`✗ pre-push check failed (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`✓ pre-push check passed: ${files.length} tracked files, videos ${(videoTotal / MB).toFixed(1)} MB.`);
