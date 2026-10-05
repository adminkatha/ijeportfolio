// Writes public/grain.png: a 128×128 tile of static monochrome noise with ~4.5% alpha baked in.
// Four grey levels keep the file tiny; at this opacity they read as continuous grain.
// Deterministic (seeded), so re-running produces the same file. Usage: node scripts/grain.mjs

import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";

const SIZE = 128;
const ALPHA = Math.round(0.045 * 255);
const LEVELS = [0, 85, 170, 255];

// mulberry32: small seeded PRNG
let seed = 20261006;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Grey + alpha, one filter byte (0) per row.
const raw = Buffer.alloc(SIZE * (1 + SIZE * 2));
let o = 0;
for (let y = 0; y < SIZE; y++) {
  raw[o++] = 0;
  for (let x = 0; x < SIZE; x++) {
    raw[o++] = LEVELS[Math.floor(rand() * LEVELS.length)];
    raw[o++] = ALPHA;
  }
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 4; // colour type: greyscale + alpha

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync("public/grain.png", png);
console.log(`public/grain.png: ${SIZE}×${SIZE}, ${png.length} bytes`);
