// Transplant the settled-powder region from a good white-powder sibling
// (tirzepatide) into the two vials that render as empty clear glass
// (tb-500, ipamorelin). All 14 _regen images share pixel-identical bottle
// framing, so the powder region below the label aligns glass-to-glass. A
// feathered alpha mask blends the patch into the (identical) glass walls/base
// with no visible seam. Deterministic — no Gemini, so sizing stays identical.
//
// Usage: node scripts/fill-empty-vials.mjs [donor] [target...]
import sharp from "sharp";
import path from "node:path";

const OUT = "/Users/jacksonorndorff/Developer/Kairo-Labs/public/_regen";
const [donorArg, ...targetArgs] = process.argv.slice(2);
const DONOR = donorArg || "tirzepatide";
const TARGETS = targetArgs.length ? targetArgs : ["tb-500", "ipamorelin"];

// Powder region (below label bottom ~770, down to base ~836; bottle interior x)
const L = 392, T = 764, Wd = 268, Hd = 76;
const FEATH = 10;          // px of soft fade into the glass walls/label edge
const SIGMA = 7;

// feathered alpha: white interior inset by FEATH, blurred
const maskSvg = Buffer.from(
  `<svg width="${Wd}" height="${Hd}"><rect x="${FEATH}" y="${FEATH}" ` +
  `width="${Wd - 2 * FEATH}" height="${Hd - 2 * FEATH}" fill="#fff"/></svg>`
);
const mask = await sharp(maskSvg).blur(SIGMA).removeAlpha().toColourspace("b-w").raw().toBuffer();

const patchRGB = await sharp(path.join(OUT, `${DONOR}.png`))
  .extract({ left: L, top: T, width: Wd, height: Hd })
  .removeAlpha().raw().toBuffer();

// merge mask as alpha channel of the patch
const patchRGBA = Buffer.alloc(Wd * Hd * 4);
for (let i = 0; i < Wd * Hd; i++) {
  patchRGBA[i * 4] = patchRGB[i * 3];
  patchRGBA[i * 4 + 1] = patchRGB[i * 3 + 1];
  patchRGBA[i * 4 + 2] = patchRGB[i * 3 + 2];
  patchRGBA[i * 4 + 3] = mask[i];
}
const patchPng = await sharp(patchRGBA, { raw: { width: Wd, height: Hd, channels: 4 } })
  .png().toBuffer();

for (const slug of TARGETS) {
  const f = path.join(OUT, `${slug}.png`);
  const base = await sharp(f).toBuffer();
  await sharp(base)
    .composite([{ input: patchPng, left: L, top: T }])
    .png().toFile(f + ".tmp");
  await sharp(f + ".tmp").toFile(f);
  console.log(`✓ filled ${slug} from ${DONOR}`);
}
console.log("done");
