// Deterministic fix for the stubborn "CJC"->"CJJ" garble: take a clean base
// render (correct layout + full powder, wrong name) and paint the correctly
// spelled name over the white label band. Output -> public/_regen/<slug>.png
import sharp from "sharp";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const TRY = path.resolve(new URL("public/_regen/_try", root).pathname);
const OUT = path.resolve(new URL("public/_regen", root).pathname);

// base file, correct name text, detected old-name box {x,y,w,h}
const JOBS = [
  { slug: "cjc-1295",      base: "cjc-1295-4.png",      name: "CJC-1295",         box: { x: 417, y: 589, w: 221, h: 63 } },
  { slug: "cjc-ipa-blend", base: "cjc-ipa-blend-4.png", name: "CJC + IPAMORELIN", box: { x: 378, y: 590, w: 316, h: 44 } },
];

function nameSvg(text) {
  // big, tight, black on transparent — trimmed + scaled afterward
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="6000" height="500">
    <text x="20" y="320" font-family="Helvetica, Arial, sans-serif" font-weight="bold"
      font-size="300" fill="#141414">${text}</text>
  </svg>`);
}

for (const j of JOBS) {
  const basePath = path.join(TRY, j.base);
  const centerY = j.box.y + j.box.h / 2;

  // 1) render + trim the correct name to its tight content box
  const trimmed = await sharp(nameSvg(j.name)).trim().png().toBuffer();

  // 2) fit to the EXACT original name box (stretch to match its condensed proportions)
  const targetW = j.box.w, targetH = j.box.h;
  const scaled = await sharp(trimmed)
    .resize({ width: targetW, height: targetH, fit: "fill" }).png().toBuffer();

  // 3) white-out the old name (between divider above and dose pill below)
  const whiteW = j.box.w + 80, whiteH = 92;
  const whiteLeft = Math.max(0, j.box.x - 40);
  const whiteTop = Math.round(centerY - whiteH / 2);
  const whitePatch = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${whiteW}" height="${whiteH}"><rect width="100%" height="100%" fill="#ffffff"/></svg>`
  );

  const out = await sharp(basePath)
    .composite([
      { input: whitePatch, left: whiteLeft, top: whiteTop },
      { input: scaled, left: j.box.x, top: j.box.y },
    ])
    .png()
    .toFile(path.join(OUT, `${j.slug}.png`));

  console.log(`✓ ${j.slug} "${j.name}"  text ${targetW}x${targetH} @ ${j.box.x},${Math.round(centerY - targetH / 2)}`);
}
console.log("done →", OUT);
