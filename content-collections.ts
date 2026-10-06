import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";

/** "Key technical decision" → "key-technical-decision" (heading ids for in-page links). */
const toId = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const headingsOf = (markdown: string) =>
  [...markdown.matchAll(/^##\s+(.+?)\s*#*\s*$/gm)].map((m) => ({ text: m[1]!, id: toId(m[1]!) }));

const FILL_IN_TAG = /<FillIn>[\s\S]*?<\/FillIn>/g;

/**
 * What the site shows of a case study: every <FillIn> question removed, and every "## Section" left with no
 * text dropped (heading included). The questions stay in the source and are listed by `pnpm fill-ins`.
 */
function visibleMarkdown(markdown: string) {
  const parts = markdown.split(/^(?=##\s)/m);
  const kept: string[] = [];
  const hidden: string[] = [];
  for (const part of parts) {
    const [first = "", ...rest] = part.split("\n");
    const isSection = /^##\s/.test(first);
    const body = (isSection ? rest.join("\n") : part).replace(FILL_IN_TAG, "").replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
    if (!isSection) {
      if (body.trim()) kept.push(body.trim());
    } else if (body.trim()) {
      kept.push(`${first.trim()}\n\n${body.trim()}`);
    } else {
      hidden.push(first.replace(/^##\s+/, "").trim());
    }
  }
  return { markdown: kept.join("\n\n") + "\n", hidden };
}

// Case studies: content/work/<project-slug>.mdx. The source keeps every required H2 per discipline (checked in
// lib/content.ts against content/data/projects.ts, failing the build with the file and the missing headings);
// the site renders only the sections that have real content.
const work = defineCollection({
  name: "work",
  directory: "content/work",
  include: "*.mdx",
  schema: z.object({
    /** Optional one-line intro shown under the title. */
    lede: z.string().optional(),
    content: z.string(),
  }),
  transform: async (doc, context) => {
    const { markdown, hidden } = visibleMarkdown(doc.content);
    const body = await compileMDX(context, { ...doc, content: markdown });
    return {
      ...doc,
      slug: doc._meta.path,
      /** Every H2 in the source (the template check). */
      sourceHeadings: headingsOf(doc.content),
      /** The H2s the site shows (sections with real content). */
      headings: headingsOf(markdown),
      /** Sections hidden because they only hold unanswered questions. */
      hiddenSections: hidden,
      body,
    };
  },
});

// Writing: hidden (with its nav link and route) while empty.
const posts = defineCollection({
  name: "posts",
  directory: "content/writing",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.iso.date(),
    content: z.string(),
  }),
  transform: async (doc, context) => {
    const body = await compileMDX(context, doc);
    return { ...doc, slug: doc._meta.path, body };
  },
});

export default defineConfig({ content: [work, posts] });
