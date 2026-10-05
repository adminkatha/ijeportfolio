import { fillIn, nowSchema, validate } from "./schema";

// INTAKE §6.
export const now = validate("content/data/now.ts", nowSchema, {
  building: [{ name: fillIn("what you're building now"), description: fillIn("one line about it") }],
  learning: [fillIn("what you're learning now")],
  updatedAt: fillIn("date this was last true, YYYY-MM-DD"),
});
