// Template-guided re-roll: IMAGE 1 = approved style ref, IMAGE 2 = correct-glyph
// name template. Tell the model to copy the product name glyphs from IMAGE 2.
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
const OUT = path.resolve(new URL("public/_regen/_try", root).pathname);
mkdirSync(OUT, { recursive: true });

const FULL = "a GENEROUS, DENSE, FULL puck of white lyophilized powder that fills the entire bottom of the vial and rises to roughly one third of the vial's height — thick, solid and substantial, a full chalky-white cake clearly visible below the label, NOT thin or sparse or barely-there";

function prompt(name) {
  return `IMAGE 1 is the approved Kairo Labs product photo. IMAGE 2 shows the EXACT product name text to use.
Recreate IMAGE 1 EXACTLY — identical clear-glass vial; identical JET-BLACK crimp cap with brushed-silver collar; identical matte WHITE wrap label; identical Kairo Labs logo at the top (emerald fused-hexagon molecule + node-dots merged with the geometric "K", and the black "KAIRO LABS" wordmark) — reproduce that SAME logo; identical emerald divider rule; identical bold BLACK product-name font/size/position; identical emerald "10 MG" dose pill; identical black-outline "Purity ≥ 99%" chip; identical emerald "RESEARCH USE ONLY • VERIFIED PURITY" bottom line; identical bright near-white studio background with soft shadow and reflection; identical square 1:1 framing.

CHANGE ONLY THESE:
  1. The bold black product name must read the EXACT characters shown in IMAGE 2: "${name}". Copy that glyph sequence letter-for-letter — note the name starts C, J, C (the third glyph is a C, an open curve, NOT a J). Render it in IMAGE 1's own bold label font, same size and left position as the original name.
  2. Contents inside the vial: ${FULL}.

Everything else pixel-for-pixel identical to IMAGE 1. Photorealistic, tack-sharp, the product name spelled EXACTLY "${name}", no warped/doubled text, no artifacts.`;
}

async function gen(slug, name, tpl, n) {
  const tplB64 = readFileSync(path.join(OUT, tpl)).toString("base64");
  const parts = [
    { text: prompt(name) },
    { inlineData: { mimeType: "image/png", data: refB64 } },
    { inlineData: { mimeType: "image/png", data: tplB64 } },
  ];
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.join(OUT, `${slug}-t${n}.png`);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
      for (const p of res.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug}-t${n} "${name}"`); return true;
        }
      }
    } catch (e) { console.log(`(${slug}-t${n}/${model}) ${e.message?.slice(0,110)}`); }
  }
  console.log(`✗ ${slug}-t${n}`); return false;
}

const TARGETS = [
  ["cjc-1295",      "CJC-1295",         "cjc-1295-name.png"],
  ["cjc-ipa-blend", "CJC + IPAMORELIN", "cjc-ipa-blend-name.png"],
];
const N = 4;
for (const [slug, name, tpl] of TARGETS)
  for (let n = 1; n <= N; n++) await gen(slug, name, tpl, n);
console.log("done →", OUT);
