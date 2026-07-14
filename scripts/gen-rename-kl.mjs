// Kairo Labs — regenerate reta/tirz vials with new KL-coded names.
// Same proven pipeline as gen-vials-v2.mjs: V4-bpc-a.png master reference,
// change ONLY the label name (dose/powder/everything else identical).
// Renders to public/_regen/ for QA before promoting to public/products/.
//   node scripts/gen-rename-kl.mjs
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const env = readFileSync(new URL(".env.local", root), "utf8");
const apiKey = Object.fromEntries(env.split("\n").filter(Boolean).map((l) => {
  const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
})).GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const REF = path.resolve(new URL("public/mockups/V4-bpc-a.png", root).pathname);
const refB64 = readFileSync(REF).toString("base64");
const OUT = path.resolve(new URL("public/_regen", root).pathname);
mkdirSync(OUT, { recursive: true });

const WHITE_FILL = "a thin, shallow, flat settled layer of fine white lyophilized powder resting at the very BOTTOM of the vial, low and understated, mostly hidden behind the lower edge of the label — the entire UPPER portion of the vial above the label is CLEAR EMPTY glass with absolutely NO powder, NO mound, NO heap rising up into the vial's neck or shoulder; just a subtle flat layer at the base";

// [slug(output filename), label name, dose shown]
const CATALOG = [
  ["kl-3-rt", "KL-3 RT", "10 MG"],
  ["kl-2-tz", "KL-2 TZ", "10 MG"],
];

function prompt(name, dose) {
  const mgNum = dose.replace(/MG|ML/i, "").trim();
  const unit = /ML/i.test(dose) ? "ML" : "MG";
  return `IMAGE 1 is the approved Kairo Labs product photo. Recreate it EXACTLY — identical clear-glass vial; identical JET-BLACK crimp cap with brushed-silver collar; identical matte WHITE wrap label; identical Kairo Labs logo at the top (the emerald fused-hexagon molecule with node-dots merged with the geometric "K", and the black "KAIRO LABS" wordmark) — reproduce that SAME logo, do not redesign it; identical emerald divider rule; identical bold BLACK product-name font; identical emerald dose pill; identical black-outline "Purity ≥ 99%" chip; identical emerald "RESEARCH USE ONLY • VERIFIED PURITY" bottom line; identical bright near-white studio background with soft shadow and reflection; identical square 1:1 framing and composition.

CHANGE ONLY THESE:
  1. Product name reads EXACTLY "${name}" — bold black, on a single line, every character a real letter or digit exactly as written (the "3" is a three, the "2" is a two, "KL" are capital letters, keep the hyphen and the single space exactly). No extra words, no lowercase, no serifs.
  2. Dose pill reads "${mgNum} ${unit}".
  3. Contents inside the vial: ${WHITE_FILL}.

Everything else pixel-for-pixel identical to IMAGE 1. Photorealistic, tack-sharp, perfectly spelled, no warped/doubled text, no smudges, no artifacts.`;
}

async function gen(slug, name, dose) {
  const parts = [
    { text: prompt(name, dose) },
    { inlineData: { mimeType: "image/png", data: refB64 } },
  ];
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.join(OUT, `${slug}.png`);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
      for (const p of res.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug.padEnd(10)} "${name}" ${dose}`); return true;
        }
      }
    } catch (e) { console.log(`(${slug}/${model}) ${e.message?.slice(0,110)}`); }
  }
  console.log(`✗ ${slug} — no image`); return false;
}

for (const [slug, name, dose] of CATALOG) {
  await gen(slug, name, dose);
}
console.log("done →", OUT);
