import { z } from "zod";

/*
 * Content model (PLAN §4). Every data file in content/data is parsed with these schemas when it is imported,
 * so invalid content fails `pnpm build` with a message naming the file and the field.
 * Unknown facts are written as fillIn("…") and render as a visible [FILL IN: …] placeholder.
 */

// ── [FILL IN] placeholders ────────────────────────────────────────────────────

export const FILL_IN_RE = /^\[FILL IN: .+\]$/;
export const fillIn = (question: string) => `[FILL IN: ${question}]`;
export const isFillIn = (value: unknown): value is string => typeof value === "string" && FILL_IN_RE.test(value);

const fillInString = z.string().regex(FILL_IN_RE, "must be fillIn(\"…\")");
const text = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });
const publicPath = z.string().regex(/^\/[^\s?#]+$/, "must be a path under /public, e.g. /media/img/x.jpg");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");

/** Contains something that looks like a phone number (never published, CLAUDE.md). */
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)\s?|\d{2,4}[\s.-])\d{3,4}[\s.-]\d{3,4}/;
const noPhone = (s: string) => !PHONE_RE.test(s);

// ── Shared pieces ─────────────────────────────────────────────────────────────

export const imageSchema = z.object({
  src: publicPath,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: text,
  caption: text.optional(),
  /** Carousel or set name, used to group a gallery. */
  group: text.optional(),
});

export const videoSchema = z.object({
  src: publicPath.regex(/\.mp4$/, "must be an .mp4"),
  poster: publicPath,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  title: text,
  description: text.optional(),
  durationSec: z.number().positive().optional(),
  /** WebVTT captions, if he has them. */
  captions: publicPath.optional(),
  /** Has a soundtrack (licensed or original music, or voice). Screen recordings are silent. */
  audio: z.boolean().default(false),
});

/** A live, read-only dashboard demo served from /public/demos/<slug>/ (always sample data). */
export const demoSchema = z.object({
  slug,
  client: text,
  title: text,
  src: z.string().regex(/^\/demos\/[a-z0-9-]+\/index\.html$/, "must be /demos/<slug>/index.html"),
  preview: imageSchema,
  sampleData: z.literal(true),
  note: text.optional(),
});

// ── Profile ───────────────────────────────────────────────────────────────────

export const profileSchema = z
  .object({
    name: text,
    title: text,
    roleLine: text,
    positioning: text,
    bio: z.array(text).min(1),
    location: text,
    email: z.email(),
    availability: text.optional(),
    links: z.object({
      github: z.union([httpUrl, fillInString]).optional(),
      linkedin: z.union([httpUrl, fillInString]).optional(),
      resume: z.union([publicPath, fillInString]),
      other: z.array(z.object({ label: text, href: httpUrl })).default([]),
    }),
    photo: imageSchema.omit({ caption: true, group: true }),
  })
  .refine((p) => JSON.stringify(p).split('"').every(noPhone), "profile must not contain a phone number");

// ── Projects ──────────────────────────────────────────────────────────────────

export const disciplines = ["web-systems", "campaigns", "video", "creative"] as const;
export type Discipline = (typeof disciplines)[number];
export const disciplineLabels: Record<Discipline, string> = {
  "web-systems": "Web & Systems",
  campaigns: "Campaigns",
  video: "Video",
  creative: "Creative",
};

export const sectors = ["clothing", "services", "property"] as const;
export type Sector = (typeof sectors)[number];

/** Disciplines whose case study (content/work/<slug>.mdx) is required, with its required H2s in order. */
export const caseStudySections: Partial<Record<Discipline, readonly string[]>> = {
  "web-systems": ["Problem", "Context", "Constraints", "Architecture", "Implementation", "Key technical decision", "Result", "What I learned"],
  campaigns: ["Objective", "Audience", "Creative approach", "Setup", "Results", "What I learned"],
};

export const projectSchema = z
  .object({
    slug,
    title: text,
    /** Small label above the title, e.g. "Website + operations portal". */
    eyebrow: text,
    /** Primary discipline: picks the page template. */
    discipline: z.enum(disciplines),
    /** Extra disciplines this piece also appears under in the /work filter. */
    alsoIn: z.array(z.enum(disciplines)).default([]),
    sector: z.enum(sectors).optional(),
    summary: text,
    role: text,
    /** Tools, for non-dev work too. */
    stack: z.array(text).default([]),
    /** Real outcomes only. */
    result: text.optional(),
    /** Real numbers only. */
    metric: z.object({ value: text, label: text }).optional(),
    liveUrl: z.union([httpUrl, fillInString]).optional(),
    /** Link text for liveUrl when it isn't a client's live site (e.g. "View the site"). */
    liveLabel: text.optional(),
    githubUrl: httpUrl.optional(),
    /** Named only with permission. */
    client: z.object({ name: text, url: httpUrl.optional() }).optional(),
    cover: imageSchema.optional(),
    gallery: z.array(imageSchema).default([]),
    videos: z.array(videoSchema).default([]),
    demos: z.array(demoSchema).default([]),
    /** One-line notes shown on the page about what was changed for privacy (e.g. "Figures blurred."). */
    disclosures: z.array(text).default([]),
    /** Slugs of related pieces (e.g. the same client in another discipline). */
    related: z.array(slug).default([]),
    isSample: z.boolean().default(false),
    featured: z.boolean().default(false),
    order: z.number().int(),
    status: z.enum(["shipped", "in-progress"]),
    year: z.number().int().min(2000).max(2100).optional(),
  })
  .superRefine((p, ctx) => {
    if (p.isSample && p.client) {
      ctx.addIssue({ code: "custom", path: ["client"], message: "sample work can't name a client" });
    }
    if (p.isSample && p.metric && !/sample/i.test(p.metric.label)) {
      ctx.addIssue({ code: "custom", path: ["metric", "label"], message: "metrics on sample work must be labelled as sample data" });
    }
    if (p.alsoIn.includes(p.discipline)) {
      ctx.addIssue({ code: "custom", path: ["alsoIn"], message: "repeats the primary discipline" });
    }
    if (p.demos.length && !p.disclosures.some((d) => /sample/i.test(d))) {
      ctx.addIssue({ code: "custom", path: ["disclosures"], message: "projects with demos must say the demos use sample data" });
    }
  });

export const projectsSchema = z
  .array(projectSchema)
  .superRefine((list, ctx) => {
    const seen = new Set<string>();
    for (const [i, p] of list.entries()) {
      if (seen.has(p.slug)) ctx.addIssue({ code: "custom", path: [i, "slug"], message: `duplicate slug "${p.slug}"` });
      seen.add(p.slug);
    }
    for (const [i, p] of list.entries()) {
      for (const r of p.related) {
        if (!seen.has(r)) ctx.addIssue({ code: "custom", path: [i, "related"], message: `unknown related slug "${r}"` });
      }
    }
    if (list.filter((p) => p.featured).length > 4) {
      ctx.addIssue({ code: "custom", message: "feature at most 4 projects on the homepage" });
    }
  });

// ── Experience, capabilities, now, playground ─────────────────────────────────

/** "YYYY" or "YYYY-MM" (his CV gives years). */
const yearOrMonth = z.string().regex(/^\d{4}(-\d{2})?$/, 'must be "YYYY" or "YYYY-MM"');

export const experienceSchema = z.array(
  z.object({
    company: text,
    role: text,
    /** Omitted when unknown (his CV gives no dates for freelance work). */
    start: z.union([yearOrMonth, fillInString]).optional(),
    /** null = present; omitted when unknown. */
    end: z.union([yearOrMonth, fillInString]).nullable().optional(),
    url: httpUrl.optional(),
    freelance: z.boolean().optional(),
    /** Real outcomes only; may be empty. */
    bullets: z.array(text).default([]),
    tech: z.array(text).default([]),
  }),
);

/** Courses and certificates. */
export const trainingSchema = z.array(
  z.object({
    name: text,
    issuer: text,
    note: text.optional(),
    description: text.optional(),
  }),
);

export const capabilityGroups = ["Creative", "Marketing", "Web"] as const;
export const capabilitiesSchema = z.array(
  z.object({
    group: z.enum(capabilityGroups),
    items: z
      .array(
        z.object({
          name: text,
          /** One line of evidence (a project or a job), when there is one. */
          evidence: text.optional(),
          projectSlug: slug.optional(),
        }),
      )
      .min(1),
    /** The tools he uses for this kind of work. */
    tools: z.array(text).default([]),
  }),
);

/** The Now section and /now are hidden (with their nav links) while this has nothing real in it. */
export const nowSchema = z.object({
  building: z.array(z.object({ name: text, description: text, url: httpUrl.optional() })).default([]),
  learning: z.array(text).default([]),
  /** "YYYY-MM-DD" or fillIn(…) */
  updatedAt: z.union([z.iso.date(), fillInString]).optional(),
});

export const playgroundSchema = z.array(
  z.object({ title: text, description: text, href: z.union([httpUrl, publicPath]), media: imageSchema.optional() }),
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type Image = z.infer<typeof imageSchema>;
export type Video = z.infer<typeof videoSchema>;
export type Demo = z.infer<typeof demoSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Experience = z.infer<typeof experienceSchema>[number];
export type CapabilityGroup = z.infer<typeof capabilitiesSchema>[number];
export type Training = z.infer<typeof trainingSchema>[number];
export type Now = z.infer<typeof nowSchema>;
export type PlaygroundItem = z.infer<typeof playgroundSchema>[number];

// ── Validation with readable errors ───────────────────────────────────────────

/** Parses `data` with `schema`; on failure throws an error that names the file and every bad field. */
export function validate<T extends z.ZodType>(file: string, schema: T, data: z.input<T>): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`\n✗ ${file} is invalid:\n${z.prettifyError(result.error)}\n`);
  }
  return result.data;
}
