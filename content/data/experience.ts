import { experienceSchema, fillIn, validate } from "./schema";

// INTAKE §4. Company named only with permission; bullets are real outcomes only.
export const experience = validate("content/data/experience.ts", experienceSchema, [
  {
    company: fillIn("company name (or 'don't name')"),
    role: "Digital Marketing, Social Media and Creative Specialist",
    start: fillIn("start month and year"),
    end: null,
    bullets: [fillIn("2–4 real outcomes from this role")],
    tech: ["Adobe Premiere Pro", "Adobe Photoshop", "Canva", "Meta Business Suite", "Google Sheets", "Excel", "ActiveCampaign"],
  },
]);
