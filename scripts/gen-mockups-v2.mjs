// Kairo Labs — Direction B, brand-correct (white + emerald + black) mockups
// Clean light studio aesthetic, but Kairo branding: white label, black type,
// emerald accents, molecule-K logo. Cap variants for review.
// Usage: node scripts/gen-mockups-v2.mjs
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

function fillFor(slug) {
  if (slug === "ghk-cu") return "a small neat cake of deep copper-blue lyophilized (freeze-dried) powder settled at the bottom of the vial";
  return "a small neat puck of white lyophilized (freeze-dried) powder settled at the bottom of the vial";
}

// cap: "black" or "silver"
function prompt(name, mg, slug, cap) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  const capDesc = cap === "black"
    ? "a smooth matte JET-BLACK aluminium crimp cap with a thin brushed-silver collar ring at its base"
    : "a smooth brushed-SILVER aluminium crimp cap with a bright polished ring";
  return `A premium, ultra-clean studio product photograph of a single small pharmaceutical research vial — bright, airy, minimalist, flawless — in the polished style of a high-end peptide brand.

THE VIAL: a short clear glass vial containing ${fillFor(slug)}; topped by ${capDesc}; wrapped with one clean MATTE WHITE paper label.

BRANDING ON THE WHITE LABEL — strict palette of BLACK ink + electric spring-EMERALD (#19C37D) accents only, modern clean geometric sans-serif, perfectly spelled and tack-sharp:
  • Top: a small logo = an EMERALD molecule-hexagon ring with a geometric black "K" fused inside it, next to the black wordmark "KAIRO LABS".
  • A thin emerald divider rule.
  • Product name: "${upper}" — large, BOLD, BLACK, every character a real letter (the letter C is a C, never the digit 3 or 0).
  • Dose: a small rounded EMERALD pill containing white "${mgNum} MG".
  • A small thin-outline rounded chip in black reading "Purity ≥ 99%".
  • Bottom line, small EMERALD uppercase, perfectly legible, EXACTLY: "RESEARCH USE ONLY • VERIFIED PURITY".

LIGHTING & SET: soft, diffuse, bright studio light; the vial stands on a clean seamless surface with a soft realistic drop shadow and a gentle reflection; background is a smooth, near-white studio gradient with the faintest cool mint tint, softly out of focus. Photorealistic, tack-sharp on glass and label, no artifacts, no warped or doubled text. The WHOLE vial centered with generous even margin, nothing cropped. Square 1:1 framing.`;
}

const JOBS = [
  ["V2-bpc-blackcap",  prompt("BPC-157", "10MG", "bpc-157", "black")],
  ["V2-bpc-silvercap", prompt("BPC-157", "10MG", "bpc-157", "silver")],
  ["V2-ghk-blackcap",  prompt("GHK-Cu", "50MG", "ghk-cu",  "black")],
];

async function gen(label, p) {
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts: [{ text: p }] }] });
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
