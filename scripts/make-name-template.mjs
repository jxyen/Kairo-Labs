// Rasterize correct product-name glyphs to PNG (bold black on white) so Gemini
// has a VISUAL target for stubborn spellings (it garbles "CJC" -> "CJJ").
import sharp from "sharp";
import path from "node:path";

const root = new URL("..", import.meta.url);
const OUT = path.resolve(new URL("public/_regen/_try", root).pathname);

const NAMES = [
  ["cjc-1295-name",      "CJC-1295"],
  ["cjc-ipa-blend-name", "CJC + IPAMORELIN"],
];

function svg(text) {
  const w = 1600, h = 360, pad = 80;
  // crude width estimate for bold sans: ~0.62em per char
  const fit = Math.min(210, Math.floor((w - 2 * pad) / (text.length * 0.62)));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="white"/>
    <text x="${w/2}" y="${h/2}" font-family="Helvetica, Arial, sans-serif"
      font-weight="bold" font-size="${fit}" fill="black"
      text-anchor="middle" dominant-baseline="central">${text}</text>
  </svg>`;
}

for (const [slug, text] of NAMES) {
  await sharp(Buffer.from(svg(text))).png().toFile(path.join(OUT, `${slug}.png`));
  console.log("✓", slug, `"${text}"`);
}
console.log("done →", OUT);
