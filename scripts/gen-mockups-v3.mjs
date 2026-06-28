// Kairo Labs — Direction B v3: lock the approved style, swap in the REAL logo.
// Passes two refs to Gemini: (1) the approved mockup for exact style/font/layout,
// (2) the real Kairo logo mark to reproduce faithfully on the label.
// Usage: node scripts/gen-mockups-v3.mjs
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const env = readFileSync(new URL(".env.local", root), "utf8");
const apiKey = Object.fromEntries(env.split("\n").filter(Boolean).map((l) => {
  const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
})).GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });
const OUT = path.resolve(new URL("public/mockups", root).pathname);
mkdirSync(OUT, { recursive: true });

const BASE = path.resolve(new URL("public/mockups/V2-bpc-blackcap.png", root).pathname); // approved style
const LOGO = path.resolve(new URL("public/kairo-mark-new.png", root).pathname);          // real mark
const baseB64 = readFileSync(BASE).toString("base64");
const logoB64 = readFileSync(LOGO).toString("base64");

function fillFor(slug) {
  if (slug === "ghk-cu") return "a small neat cake of deep copper-blue lyophilized powder at the bottom";
  return "a small neat puck of white lyophilized powder at the bottom";
}

function prompt(name, mg, slug) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  return `IMAGE 1 is an approved Kairo Labs product photo. IMAGE 2 is the REAL Kairo Labs logo.

Recreate IMAGE 1 EXACTLY — keep the identical clean clear-glass vial, the matte JET-BLACK crimp cap with brushed-silver collar, the matte WHITE wrap label, the same minimalist layout, the same bold black product-name font, the same EMERALD (#19C37D) "${mgNum} MG" pill, the same black thin-outline "Purity ≥ 99%" chip, the same emerald bottom line "RESEARCH USE ONLY • VERIFIED PURITY", the same bright near-white studio background, soft shadow and reflection, and square 1:1 framing.

CHANGE ONLY TWO THINGS:
  1. THE LOGO at the top of the label: replace it with the EXACT logo shown in IMAGE 2 — emerald line-art of two fused hexagonal molecule rings with small node dots on the left, merged into a tall geometric OUTLINED letter "K" on the right. Reproduce that mark faithfully (do NOT redesign it into a plain hexagon). Place the emerald mark at left with the black wordmark "KAIRO LABS" set beside it, neatly aligned. Keep it crisp and correctly proportioned.
  2. The product name reads EXACTLY "${upper}" (every character a real letter; C is a C, never 3 or 0), and the contents inside the vial are ${fillFor(slug)}.

Everything else identical to IMAGE 1. Photorealistic, tack-sharp, perfectly spelled, no warped or doubled text, no artifacts.`;
}

const JOBS = [
  ["V3-bpc-157",     prompt("BPC-157", "10MG", "bpc-157")],
  ["V3-ghk-cu",      prompt("GHK-Cu", "50MG", "ghk-cu")],
  ["V3-tirzepatide", prompt("Tirzepatide", "10MG", "tirzepatide")],
];

async function gen(label, p) {
  const parts = [
    { text: p },
    { inlineData: { mimeType: "image/png", data: baseB64 } },
    { inlineData: { mimeType: "image/png", data: logoB64 } },
  ];
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
      for (const part of res.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          writeFileSync(path.join(OUT, `${label}.png`), Buffer.from(part.inlineData.data, "base64"));
          console.log(`✓ ${label} (${model})`); return;
        }
      }
    } catch (e) { console.log(`(${label}/${model}) ${e.message?.slice(0,120)}`); }
  }
  console.log(`✗ ${label}`);
}

for (const [label, p] of JOBS) await gen(label, p);
console.log("done →", OUT);
