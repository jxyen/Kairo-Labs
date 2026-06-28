// Remove the gray "name-band" rectangle defect on the two CJC vials, leaving the
// product name flush on clean white like every other bottle.
//
// The earlier fix-cjc pass painted a flat color-matched rectangle behind the name,
// sampling a label color that was slightly gray (~240) vs the true label white
// (~246) — a subtle but visible box. Here we REFILL that band with the label's
// real white, sampled per-row from the clean margins just OUTSIDE the box, so the
// fill matches the bottle's cylindrical shading. Existing black glyphs are kept.
import sharp from "sharp";
import path from "node:path";
import { renameSync } from "node:fs";

const root = new URL("..", import.meta.url);
const DIR = path.resolve(new URL("public/products", root).pathname);

// Region covering both name-bands (blend name is wider). Below the emerald
// divider, above the dose pills.
const REG = { x0: 388, x1: 690, y0: 570, y1: 716 };
// Clean-white margins just outside the box, sampled per row.
const LM = { x0: 345, x1: 382 };
const RM = { x0: 700, x1: 735 };
const TEXT_KEEP = 214; // pixels darker than this are glyph/anti-alias -> keep

const JOBS = ["cjc-1295", "cjc-ipa-blend"];

for (const slug of JOBS) {
  const file = path.join(DIR, `${slug}.png`);
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, ch = info.channels;
  const out = Buffer.from(data); // copy to mutate
  const lum = (x, y) => { const i = (y * W + x) * ch; return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; };
  const rowWhite = (x0, x1, y) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let x = x0; x < x1; x++) { const i = (y * W + x) * ch; r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    return [r / n, g / n, b / n];
  };

  let filled = 0;
  for (let y = REG.y0; y < REG.y1; y++) {
    const L = rowWhite(LM.x0, LM.x1, y);
    const R = rowWhite(RM.x0, RM.x1, y);
    for (let x = REG.x0; x < REG.x1; x++) {
      if (lum(x, y) < TEXT_KEEP) continue; // keep glyphs + their soft edges
      const t = (x - REG.x0) / (REG.x1 - REG.x0);
      const i = (y * W + x) * ch;
      out[i] = Math.round(L[0] + (R[0] - L[0]) * t);
      out[i + 1] = Math.round(L[1] + (R[1] - L[1]) * t);
      out[i + 2] = Math.round(L[2] + (R[2] - L[2]) * t);
      filled++;
    }
  }

  const tmp = path.join(DIR, `_${slug}.png`);
  await sharp(out, { raw: { width: W, height: info.height, channels: ch } }).png().toFile(tmp);
  renameSync(tmp, file);
  console.log(`✓ ${slug}: refilled ${filled} px with per-row label white`);
}
console.log("done");
