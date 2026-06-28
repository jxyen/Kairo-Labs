// Kairo Labs — product-image REDESIGN mockups (review before batch regen)
// Generates two directions for review:
//   A = refined dark Kairo vial (flawless, relabeled)
//   B = clean light studio vial (Amino-reference aesthetic)
// Usage: node scripts/gen-mockups.mjs
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const envText = readFileSync(new URL(".env.local", root), "utf8");
const apiKey = Object.fromEntries(
  envText.split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
).GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env.local");

const ai = new GoogleGenAI({ apiKey });
const STYLE_REF = path.resolve(new URL("public/_master-vial.png", root).pathname);
const OUT = path.resolve(new URL("public/mockups", root).pathname);
mkdirSync(OUT, { recursive: true });

function fillFor(slug) {
  if (slug === "ghk-cu") return "a deep copper-blue lyophilized (freeze-dried) powder cake settled at the bottom of the vial";
  return "a small neat puck of white lyophilized (freeze-dried) powder settled at the bottom of the vial";
}

// DIRECTION A — refined dark Kairo vial, flawless + relabeled
function promptDark(name, mg, slug) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  return `Recreate the attached KAIRO LABS research-vial photo as a FLAWLESS, premium studio product render — same brand identity, but cleaner and more perfect than the reference.

KEEP IDENTICAL: the short stubby glass vial shape; the short black pebbled domed crimp cap with a BRIGHT POLISHED SILVER crimp-collar ring at its base; the dark charcoal label; the molecule-hexagon + "K" KAIRO LABS logo at the top of the label; clean flat-WHITE bold sans-serif product name; electric spring-emerald (#35E0A0) accent rules and dose; the pure near-black seamless studio background with a soft single-source key light and a clean reflection beneath the vial.

THE LABEL TEXT MUST BE PERFECT, CRISP AND CORRECTLY SPELLED (the old render had garbled text — fix it):
  • Top: the KAIRO LABS molecule-K logo.
  • Product name: "${upper}" — large, ALL CAPS, flat white, every character a real letter (the letter C is a C, never 3 or 0).
  • Dose: "${mgNum}" large in emerald with a small "MG" beside it.
  • One thin emerald divider rule.
  • Bottom band, small clean emerald uppercase, perfectly legible, EXACTLY: "RESEARCH USE ONLY • VERIFIED PURITY".
  • Remove any other tiny paragraph text — keep the label minimal and clean.

Contents inside the vial: ${fillFor(slug)}.
Photorealistic, tack-sharp, no smudges, no artifacts, no warped text, no double edges. The WHOLE vial centered with generous even margin — full cap at top, full glass base + reflection at bottom, nothing cropped. Square framing.`;
}

// DIRECTION B — clean light studio vial (Amino-reference aesthetic)
function promptLight(name, mg, slug) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  const labelTint = slug === "ghk-cu"
    ? "a soft dusty-rose / blush pastel"
    : "a soft pale sky-blue pastel";
  const bg = slug === "ghk-cu"
    ? "a soft warm blush-to-taupe pastel gradient"
    : "a soft cool pale-blue to light-grey pastel gradient";
  return `A premium, ultra-clean studio product photograph of a single small pharmaceutical research vial, in the polished minimalist style of high-end peptide brands — bright, airy, flawless.

THE VIAL: a short clear/frosted glass vial with ${fillFor(slug)}; topped by a smooth BRUSHED-SILVER metallic crimp cap with a bright polished aluminium ring; one matte ${labelTint} paper label wrapping the glass.

ON THE LABEL (crisp, perfectly spelled, modern clean sans-serif, dark slate-navy ink on the pastel label):
  • A small molecule-hexagon + "K" mark with "KAIRO LABS" wordmark.
  • Product name: "${upper}" — large, every character a real letter (C is a C, never 3 or 0).
  • Dose pill: "${mgNum} MG" in a small rounded dark pill.
  • A tiny rounded outline chip reading "Purity ≥ 99%".
  • Small uppercase line, perfectly legible, EXACTLY: "RESEARCH USE ONLY • VERIFIED PURITY".

LIGHTING & SET: soft, diffuse, bright studio lighting; the vial stands on a clean seamless surface with a soft realistic drop shadow and a gentle floor reflection; background is ${bg}, smooth and out of focus. Photorealistic, tack-sharp on the glass and label, no artifacts, no warped text. The WHOLE vial centered with generous even margin, nothing cropped. Square framing.`;
}

async function gen(label, prompt, useRef) {
  const parts = [{ text: prompt }];
  if (useRef) {
    const styleData = readFileSync(STYLE_REF).toString("base64");
    parts.push({ inlineData: { mimeType: "image/png", data: styleData } });
  }
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.join(OUT, `${label}.png`);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
      for (const p of res.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${label} (${model}) → ${outFile}`);
          return true;
        } else if (p.text) {
          console.log(`[${label} text] ${p.text.slice(0, 140)}`);
        }
      }
    } catch (e) {
      console.log(`(${label}/${model}) error: ${e.message?.slice(0, 140)}`);
    }
  }
  console.log(`✗ ${label} — no image`);
  return false;
}

const JOBS = [
  ["A-bpc-157", promptDark("BPC-157", "10MG", "bpc-157"), true],
  ["A-ghk-cu",  promptDark("GHK-Cu", "50MG", "ghk-cu"),  true],
  ["B-bpc-157", promptLight("BPC-157", "10MG", "bpc-157"), false],
  ["B-ghk-cu",  promptLight("GHK-Cu", "50MG", "ghk-cu"),  false],
];

for (const [label, prompt, useRef] of JOBS) {
  await gen(label, prompt, useRef);
}
console.log("done →", OUT);
