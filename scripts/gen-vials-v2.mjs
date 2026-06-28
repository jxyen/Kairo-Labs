// Kairo Labs — FINAL product-image batch (Direction B, brand-correct).
// Uses the approved mockup V4-bpc-a.png as the master style+logo reference and
// changes ONLY the product name, dose, and powder per product (consistency trick).
// Renders to public/_regen/ for QA before promoting to public/products/.
// Usage:
//   node scripts/gen-vials-v2.mjs            -> all
//   node scripts/gen-vials-v2.mjs <slug>     -> one (re-roll)
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

function fillDesc(fill) {
  if (fill === "copper") return "a thin, shallow, flat settled layer of fine deep copper-blue lyophilized powder resting at the very BOTTOM of the vial, low and understated, mostly hidden behind the lower edge of the label — the entire UPPER portion of the vial above the label is CLEAR EMPTY glass with absolutely NO powder, NO mound, NO heap rising up into the vial's neck or shoulder; just a subtle flat layer at the base";
  if (fill === "water")  return "filled ~85% with CLEAR COLORLESS bacteriostatic water (a visible liquid column with a curved meniscus, no powder)";
  return "a thin, shallow, flat settled layer of fine white lyophilized powder resting at the very BOTTOM of the vial, low and understated, mostly hidden behind the lower edge of the label — the entire UPPER portion of the vial above the label is CLEAR EMPTY glass with absolutely NO powder, NO mound, NO heap rising up into the vial's neck or shoulder; just a subtle flat layer at the base";
}

// [slug(filename), label name, dose shown, fill]
const CATALOG = [
  ["bpc-157",       "BPC-157",          "20 MG", "white"],
  ["tb-500",        "TB-500",           "10 MG", "white"],
  ["tirzepatide",   "TIRZEPATIDE",      "10 MG", "white"],
  ["retatrutide",   "RETATRUTIDE",      "10 MG", "white"],
  ["mots-c",        "MOTS-C",           "10 MG", "white"],
  ["cjc-1295",      "CJC-1295",         "10 MG", "white"],
  ["ipamorelin",    "IPAMORELIN",       "10 MG", "white"],
  ["igf-1-lr3",     "IGF-1 LR3",        "1 MG",  "white"],
  ["ghk-cu",        "GHK-CU",           "50 MG", "copper"],
  ["mt-2",          "MT-2",             "10 MG", "white"],
  ["bpc-tb-blend",  "BPC + TB-500",     "20 MG", "white"],
  ["cjc-ipa-blend", "CJC + IPAMORELIN", "10 MG", "white"],
  ["glow",          "GLOW",             "70 MG", "copper"],
  ["bac-water",     "BAC WATER",        "30 ML", "water"],
];

function prompt(name, dose, fill) {
  const mgNum = dose.replace(/MG|ML/i, "").trim();
  const unit = /ML/i.test(dose) ? "ML" : "MG";
  return `IMAGE 1 is the approved Kairo Labs product photo. Recreate it EXACTLY — identical clear-glass vial; identical JET-BLACK crimp cap with brushed-silver collar; identical matte WHITE wrap label; identical Kairo Labs logo at the top (the emerald fused-hexagon molecule with node-dots merged with the geometric "K", and the black "KAIRO LABS" wordmark) — reproduce that SAME logo, do not redesign it; identical emerald divider rule; identical bold BLACK product-name font; identical emerald dose pill; identical black-outline "Purity ≥ 99%" chip; identical emerald "RESEARCH USE ONLY • VERIFIED PURITY" bottom line; identical bright near-white studio background with soft shadow and reflection; identical square 1:1 framing and composition.

CHANGE ONLY THESE:
  1. Product name reads EXACTLY "${name}" — bold black, every character a real letter (C is a C, never 3 or 0; keep any "+", hyphens and spaces exactly).
  2. Dose pill reads "${mgNum} ${unit}".
  3. Contents inside the vial: ${fillDesc(fill)}.

Everything else pixel-for-pixel identical to IMAGE 1. Photorealistic, tack-sharp, perfectly spelled, no warped/doubled text, no smudges, no artifacts.`;
}

async function gen(slug, name, dose, fill) {
  const parts = [
    { text: prompt(name, dose, fill) },
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
          console.log(`✓ ${slug.padEnd(14)} "${name}" ${dose}`); return true;
        }
      }
    } catch (e) { console.log(`(${slug}/${model}) ${e.message?.slice(0,110)}`); }
  }
  console.log(`✗ ${slug} — no image`); return false;
}

const only = process.argv[2];
const jobs = only ? CATALOG.filter(c => c[0] === only) : CATALOG;
if (!jobs.length) { console.error("unknown slug:", only); process.exit(1); }
for (const [slug, name, dose, fill] of jobs) await gen(slug, name, dose, fill);
console.log("done →", OUT);
