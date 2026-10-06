import { experienceSchema, validate } from "./schema";

// From his CV (2026-10-06), newest first, with the CV's own dates. Bullets are the CV's, lightly tidied.
export const experience = validate("content/data/experience.ts", experienceSchema, [
  {
    company: "Agora Data Driven",
    role: "Digital Marketing / Creatives",
    start: "2025",
    end: "2026",
    bullets: [
      "Managed Meta Ads campaigns for lead generation and brand awareness.",
      "Designed static and video creatives for Facebook and Instagram advertising.",
      "Configured audience targeting, placements, budgets and campaign objectives.",
      "Built automated email workflows for customer follow-up and lead nurturing.",
      "Monitored campaign performance using CTR, CPC, CPM and conversion metrics.",
    ],
  },
  {
    company: "Academy of Success",
    role: "Video Editor",
    start: "2023",
    end: "2023",
  },
  {
    company: "Freelance",
    role: "Video Editor and Graphic Designer",
  },
  {
    company: "Rutenzo Photography",
    role: "Photographer / Videographer",
    start: "2019",
    end: "2022",
    bullets: ["Wedding photo and video shoots.", "Debut photo and video shoots.", "Same-day edits."],
  },
]);
