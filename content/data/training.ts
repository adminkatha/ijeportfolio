import { trainingSchema, validate } from "./schema";

// From his CV (2026-10-06).
export const training = validate("content/data/training.ts", trainingSchema, [
  {
    name: "Google AI Essentials",
    issuer: "Coursera",
    note: "Employer-sponsored",
    description: "AI fundamentals, prompt engineering, productivity tools and responsible AI practices.",
  },
  {
    name: "Google Digital Marketing & E-commerce",
    issuer: "Coursera",
    note: "Employer-sponsored",
    description: "Digital marketing fundamentals, social media marketing, email marketing, e-commerce, analytics and customer acquisition.",
  },
]);
