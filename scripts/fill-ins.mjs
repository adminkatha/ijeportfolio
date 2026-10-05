// Lists every [FILL IN] placeholder in content/ (fillIn("…") in data files, <FillIn>…</FillIn> in MDX)
// as a Markdown table, for docs/INTAKE.md and the final report. Usage: pnpm fill-ins

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const rows = [];
for (const file of walk("content").filter((f) => /\.(ts|mdx)$/.test(f) && !f.endsWith("schema.ts"))) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  let slugContext = "";
  lines.forEach((line, i) => {
    const slug = line.match(/slug: "([^"]+)"/);
    if (slug) slugContext = slug[1];
    for (const m of line.matchAll(/fillIn\("([^"]+)"\)|<FillIn>([^<]+)<\/FillIn>/g)) {
      const where = file.endsWith(".mdx")
        ? `${path.basename(file, ".mdx")} case study`
        : `${path.basename(file, ".ts")}${slugContext && file.includes("projects") ? ` → ${slugContext}` : ""}`;
      const field = line.trim().match(/^([A-Za-z]+):/)?.[1] ?? (file.endsWith(".mdx") ? lines.slice(0, i).reverse().find((l) => l.startsWith("## "))?.slice(3) ?? "" : "");
      rows.push({ where, field, question: m[1] ?? m[2], at: `${file.replace(/\\/g, "/")}:${i + 1}` });
    }
  });
}

console.log(`| # | Where | Field / section | Question |\n|---|---|---|---|`);
rows.forEach((r, i) => console.log(`| ${i + 1} | ${r.where} | ${r.field} | ${r.question} |`));
console.error(`\n${rows.length} [FILL IN] placeholders.`);
