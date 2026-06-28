// Re-roll the two CJC products until "CJC" renders clean (diffusion garbles 2nd C -> J).
// Generates N attempts each into public/_regen/_try/<slug>-N.png for manual pick.
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

function prompt(name, dose) {
  const mgNum = dose.replace(/MG|ML/i, "").trim();
  return `IMAGE 1 is the approved Kairo Labs product photo. Recreate it EXACTLY — identical clear-glass vial; identical JET-BLACK crimp cap with brushed-silver collar; identical matte WHITE wrap label; identical Kairo Labs logo at the top (the emerald fused-hexagon molecule with node-dots merged with the geometric "K", and the black "KAIRO LABS" wordmark) — reproduce that SAME logo, do not redesign it; identical emerald divider rule; identical bold BLACK product-name font; identical emerald dose pill; identical black-outline "Purity ≥ 99%" chip; identical emerald "RESEARCH USE ONLY • VERIFIED PURITY" bottom line; identical bright near-white studio background with soft shadow and reflection; identical square 1:1 framing and composition.

CHANGE ONLY THESE:
  1. Product name reads EXACTLY "${name}". CRITICAL SPELLING: it begins with the three letters C-J-C — a capital C, then a capital J, then a capital C again. The THIRD character is the letter C (a curved open C), NOT a J. Do not render "CJJ". Every other character is a real letter; keep any "+", hyphens and spaces exactly.
  2. Dose pill reads "${mgNum} MG".
  3. Contents inside the vial: ${FULL}.

Everything else pixel-for-pixel identical to IMAGE 1. Photorealistic, tack-sharp, the product name spelled EXACTLY "${name}", no warped/doubled text, no smudges, no artifacts.`;
}

async function gen(slug, name, dose, n) {
  const parts = [
    { text: prompt(name, dose) },
    { inlineData: { mimeType: "image/png", data: refB64 } },
  ];
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.join(OUT, `${slug}-${n}.png`);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
      for (const p of res.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug}-${n} "${name}"`); return true;
        }
      }
    } catch (e) { console.log(`(${slug}-${n}/${model}) ${e.message?.slice(0,110)}`); }
  }
  console.log(`✗ ${slug}-${n}`); return false;
}

const TARGETS = [
  ["cjc-1295",      "CJC-1295",         "10 MG"],
  ["cjc-ipa-blend", "CJC + IPAMORELIN", "10 MG"],
];
const N = 4;
for (const [slug, name, dose] of TARGETS)
  for (let n = 1; n <= N; n++) await gen(slug, name, dose, n);
console.log("done →", OUT);
