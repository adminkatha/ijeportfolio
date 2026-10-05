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

// Case studies: content/work/<project-slug>.mdx. Required H2s per discipline are enforced in lib/content.ts
// (against content/data/projects.ts), which fails the build with the file name and the missing headings.
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
    const body = await compileMDX(context, doc);
    return { ...doc, slug: doc._meta.path, headings: headingsOf(doc.content), body };
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
