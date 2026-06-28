// Seamless deterministic fix for the stubborn "CJC"->"CJJ" diffusion garble.
// Operates on the freshly-generated _regen/<slug>.png. For each CJC product:
//   1) detect the dark garbled-name bounding box in the label name band
//   2) sample the label's true background color (clean strip below the divider)
//   3) paint a COLOR-MATCHED, edge-feathered patch over the garbled name
//   4) overlay the correctly-spelled black glyphs fitted to the detected box
// Color-match + feather avoids the pasted-on pure-white "sticker" look.
import sharp from "sharp";
import path from "node:path";

const root = new URL("..", import.meta.url);
const OUT = path.resolve(new URL("public/_regen", root).pathname);

// generous name band (just below emerald divider, above dose pill) for 1024x1024
const BAND = { x0: 360, x1: 700, y0: 578, y1: 660 };
// clean WHITE label strip in the thin gap just above the name (below the emerald
// divider) to sample the true label color — must avoid the green divider rule
const SAMPLE = { x0: 420, x1: 630, y0: 579, y1: 586 };

const JOBS = [
  { slug: "cjc-1295",      name: "CJC-1295" },
  { slug: "cjc-ipa-blend", name: "CJC + IPAMORELIN" },
];

function nameSvg(text) {
  // huge canvas so long names never clip before trim
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="6000" height="500">
    <text x="20" y="320" font-family="Helvetica, Arial, sans-serif" font-weight="bold"
      font-size="300" fill="#161616">${text}</text>
  </svg>`);
}

for (const j of JOBS) {
  const file = path.join(OUT, `${j.slug}.png`);
  const img = sharp(file);
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels, W = info.width;
  const px = (x, y) => { const i = (y * W + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };

  // 1) detect dark name pixels
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let y = BAND.y0; y < BAND.y1; y++)
    for (let x = BAND.x0; x < BAND.x1; x++) {
      const [r, g, b] = px(x, y);
      if (0.299 * r + 0.587 * g + 0.114 * b < 95) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  const box = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };

  // 2) sample true label color
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let y = SAMPLE.y0; y < SAMPLE.y1; y++)
    for (let x = SAMPLE.x0; x < SAMPLE.x1; x++) { const [r, g, b] = px(x, y); sr += r; sg += g; sb += b; n++; }
  const col = { r: Math.round(sr / n), g: Math.round(sg / n), b: Math.round(sb / n) };

  // 3) color-matched feathered patch covering the garbled name + a margin
  const padX = 26, padY = 20;
  const pW = box.w + padX * 2, pH = box.h + padY * 2;
  const pLeft = Math.max(0, box.x - padX), pTop = Math.max(0, box.y - padY);
  const patch = await sharp({
    create: { width: pW, height: pH, channels: 4, background: { ...col, alpha: 1 } },
  }).png().blur(6).toBuffer(); // blur feathers the edges into the label

  // 4) correct glyphs, trimmed + stretched into the exact detected box
  const trimmed = await sharp(nameSvg(j.name)).trim().png().toBuffer();
  const scaled = await sharp(trimmed)
    .resize({ width: box.w, height: box.h, fit: "fill" }).png().toBuffer();

  await sharp(file)
    .composite([
      { input: patch, left: pLeft, top: pTop },
      { input: scaled, left: box.x, top: box.y },
    ])
    .png()
    .toFile(path.join(OUT, `_${j.slug}.png`)); // temp to avoid in-place read/write clash

  console.log(`✓ ${j.slug} "${j.name}"  box ${box.w}x${box.h}@${box.x},${box.y}  label rgb(${col.r},${col.g},${col.b})`);
}

// swap temps into place
import { renameSync } from "node:fs";
for (const j of JOBS) renameSync(path.join(OUT, `_${j.slug}.png`), path.join(OUT, `${j.slug}.png`));
console.log("done →", OUT);
