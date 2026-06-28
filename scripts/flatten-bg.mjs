// Flatten the soft studio-sweep background of each vial render to pure uniform
// white, so the image sits FLUSH on any flat media panel (multiply turns the
// white into the panel color edge-to-edge — no tonal band). The vial, label,
// cap, powder and a touch of contact shadow are preserved; only the light
// background gradient is lifted to white via a feathered luminance ramp.
//
// Reads from the backup dir (re-runnable) and writes public/products/<slug>.png.
import sharp from "sharp";
import path from "node:path";
import { readdirSync } from "node:fs";

const root = new URL("..", import.meta.url);
const OUT = path.resolve(new URL("public/products", root).pathname);
const SRC = process.argv[2] || OUT; // pass a backup dir to flatten from pristine
const ONLY = process.argv[3]; // optional single slug for testing

// luminance ramp: <=LO keep original, >=HI -> pure white, between -> blend.
// Background measures ~236–247; vial structure/text/cap are well below LO.
const LO = 224, HI = 238;

const files = readdirSync(SRC).filter((f) => f.endsWith(".png") && (!ONLY || f === `${ONLY}.png`));

for (const file of files) {
  const { data, info } = await sharp(path.join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; // 4
  const out = Buffer.from(data);
  for (let i = 0; i < data.length; i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let t = (lum - LO) / (HI - LO);
    if (t <= 0) continue;
    if (t > 1) t = 1;
    out[i] = Math.round(r + (255 - r) * t);
    out[i + 1] = Math.round(g + (255 - g) * t);
    out[i + 2] = Math.round(b + (255 - b) * t);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: ch } })
    .png()
    .toFile(path.join(OUT, file));
  console.log(`✓ flattened ${file}`);
}
console.log(`done (${files.length} file${files.length === 1 ? "" : "s"})`);
