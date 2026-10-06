// Builds Ehjay Lorenzo's résumé PDF from scripts/resume/resume.html with the local Chrome (Playwright).
//
// Usage (from the repo root):
//   node scripts/resume/build.mjs
//       → public/resume.pdf (the public version: no phone number, city only)
//   node scripts/resume/build.mjs --screens <dir>
//       → also writes <dir>/resume-preview-page-N.png (1240 px wide) of the public version
//   RESUME_PHONE="…" node scripts/resume/build.mjs --private [--out <path>]
//       → the private copy with his phone number. The path must be outside the repo
//         (default: ../ehjay-files/ehjay-resume-full.pdf, next to the repo).
//
// Privacy: the phone number is never stored in the repo. It comes from RESUME_PHONE at run time and goes only into
// the page in memory and the private PDF. The public build ignores RESUME_PHONE and refuses to write a PDF whose text
// contains anything phone-like (the pattern scripts/prepush-check.mjs uses). No street address anywhere.
//
// Checks (exit code 1, nothing written, if one fails): every font loads; nothing inside a sheet is positioned,
// floated, transformed or translucent (Chrome paints those last, which scrambles the PDF's reading order for ATS
// parsers); nothing overflows its A4 sheet; and the PDF has exactly one page per .page sheet.
//
// The portrait (photo.jpg) was extracted from his CV with pypdf and cropped to 4:5 (300 × 375 px).

import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const template = path.join(here, "resume.html");

function die(message) {
  console.error(`✗ résumé: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const has = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) die(`--${name} needs a value`);
  return value;
};

const isPrivate = has("private");
const phone = isPrivate ? (process.env.RESUME_PHONE ?? "").trim() : "";
if (isPrivate && !phone) die("--private needs the phone number in RESUME_PHONE");

const insideRepo = (p) => {
  const rel = path.relative(repoRoot, p);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};
const out = path.resolve(
  option("out") ??
    (isPrivate ? path.join(repoRoot, "..", "ehjay-files", "ehjay-resume-full.pdf") : path.join(repoRoot, "public", "resume.pdf")),
);
if (!out.toLowerCase().endsWith(".pdf")) die(`--out must be a .pdf path (got ${out})`);
if (isPrivate && insideRepo(out)) die(`the private PDF must be written outside the repo (got ${out})`);

const screensArg = option("screens");
if (screensArg && isPrivate) die("--screens is for the public version only");
const screensDir = screensArg ? path.resolve(screensArg) : undefined;

// Same pattern as scripts/prepush-check.mjs (PHONE).
const PHONE = /(?<![\w.#/-])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)\s?|\d{2,4}[\s.-])\d{3,4}[\s.-]\d{3,4}(?![\w.-])/;
const MM = 96 / 25.4; // CSS px per mm
const A4_WIDTH_PX = 210 * MM; // 793.7
const PREVIEW_WIDTH = 1240; // px

async function launch() {
  try {
    return await chromium.launch({ channel: "chrome" }); // the local Chrome, no download needed
  } catch {
    return await chromium.launch(); // Playwright's Chromium, if installed
  }
}

const browser = await launch();
try {
  const context = await browser.newContext({
    viewport: { width: Math.ceil(A4_WIDTH_PX), height: 1123 },
    deviceScaleFactor: PREVIEW_WIDTH / A4_WIDTH_PX,
  });
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`page error: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`failed to load ${r.url()}`));

  await page.goto(pathToFileURL(template).href, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });

  // Phone slot: filled for the private copy, removed from the public one.
  await page.evaluate((value) => {
    for (const slot of document.querySelectorAll("[data-slot=phone]")) {
      if (!value) {
        slot.remove();
        continue;
      }
      slot.querySelector("[data-value]").textContent = value;
      slot.hidden = false;
    }
  }, phone);

  if (!isPrivate) {
    const text = await page.evaluate(() => document.body.innerText);
    const hit = text.match(PHONE);
    if (hit) problems.push(`the public version contains something phone-like: "${hit[0].trim()}"`);
  }

  // Fonts: every @font-face must load (a silent fallback would embed a system font instead).
  const fonts = await page.evaluate(async () => {
    await Promise.all([...document.fonts].map((f) => f.load().catch(() => undefined)));
    await document.fonts.ready;
    return [...document.fonts].map((f) => ({ family: f.family.replace(/"/g, ""), weight: f.weight, status: f.status }));
  });
  for (const f of fonts) if (f.status !== "loaded") problems.push(`font not loaded: ${f.family} ${f.weight} (${f.status})`);

  // Layout, per sheet (the folio is exempt): normal flow only (reading order), and nothing past the margins.
  const layout = await page.evaluate((mm) => {
    const issues = [];
    const free = [];
    const outOfFlow = (s) =>
      s.position !== "static" || s.float !== "none" || s.transform !== "none" || Number(s.opacity) < 1 || s.zIndex !== "auto";
    document.querySelectorAll(".page").forEach((sheet, i) => {
      const box = sheet.getBoundingClientRect();
      const cs = getComputedStyle(sheet);
      const right = box.right - parseFloat(cs.paddingRight);
      const bottom = box.bottom - parseFloat(cs.paddingBottom);
      for (const el of sheet.querySelectorAll("*")) {
        if (el.closest(".folio")) continue;
        const name = `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(" ")[0]}` : ""}`;
        for (const pseudo of [null, "::before", "::after"]) {
          const s = getComputedStyle(el, pseudo);
          if ((pseudo === null || s.content !== "none") && outOfFlow(s)) {
            issues.push(`page ${i + 1}: ${name}${pseudo ?? ""} is out of normal flow, so its text would be out of reading order`);
          }
        }
        const r = el.getBoundingClientRect();
        if ((r.width || r.height) && (r.right > right + 0.5 || r.bottom > bottom + 0.5)) {
          const by = Math.max(r.right - right, r.bottom - bottom) / mm;
          issues.push(`page ${i + 1}: ${name} "${(el.textContent ?? "").trim().slice(0, 40)}" overflows the margins by ${by.toFixed(1)} mm`);
        }
      }
      const used = Math.max(...[...sheet.children].filter((c) => !c.classList.contains("folio")).map((c) => c.getBoundingClientRect().bottom));
      free.push(((bottom - used) / mm).toFixed(1));
    });
    return { issues, free };
  }, MM);
  problems.push(...layout.issues);
  const sheets = layout.free.length;

  if (problems.length) {
    for (const p of problems) console.error(`  - ${p}`);
    throw new Error(`${problems.length} problem(s); nothing written`);
  }

  mkdirSync(path.dirname(out), { recursive: true });
  await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true });

  const pdfPages = (readFileSync(out, "latin1").match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length;
  if (pdfPages !== sheets) throw new Error(`the PDF has ${pdfPages} page(s) but the template has ${sheets} sheet(s): something spilled over`);

  console.log(`✓ ${isPrivate ? "private" : "public"} résumé: ${out} (${(statSync(out).size / 1024).toFixed(0)} KB, ${pdfPages} page${pdfPages === 1 ? "" : "s"})`);
  layout.free.forEach((mm, i) => console.log(`  page ${i + 1}: ${mm} mm free above the bottom margin`));

  if (screensDir) {
    mkdirSync(screensDir, { recursive: true });
    for (let i = 0; i < sheets; i++) {
      const file = path.join(screensDir, `resume-preview-page-${i + 1}.png`);
      // One sheet at a time, at the top of the page, so every preview has the same pixel size (the PDF is already written).
      await page.evaluate((n) => document.querySelectorAll(".page").forEach((p, j) => (p.style.display = j === n ? "" : "none")), i);
      await page.locator(".page").nth(i).screenshot({ path: file, animations: "disabled" });
      console.log(`  preview: ${file}`);
    }
  }
} catch (error) {
  console.error(`✗ résumé: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
