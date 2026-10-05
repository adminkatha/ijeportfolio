import { playgroundSchema, validate } from "./schema";

// Hidden (with its nav link) while empty (INTAKE §7).
export const playground = validate("content/data/playground.ts", playgroundSchema, []);
