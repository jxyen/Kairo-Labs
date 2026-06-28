// v4: push logo fidelity with precise geometry description + real logo ref.
// Two BPC attempts to pick the best (diffusion is stochastic).
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

const BASE = path.resolve(new URL("public/mockups/V3-bpc-157.png", root).pathname); // approved style+layout
const LOGO = path.resolve(new URL("public/kairo-logo-stacked.png", root).pathname); // clearest full logo
const baseB64 = readFileSync(BASE).toString("base64");
const logoB64 = readFileSync(LOGO).toString("base64");

const LOGO_DESC = `The Kairo Labs logo is a precise emerald line-art mark with TWO parts sitting side by side:
  • LEFT: a MOLECULE skeleton — TWO six-sided hexagon rings fused together one above the other (like a chemistry steroid/benzene structure), drawn as thin emerald outlines, with three small SOLID emerald dots (atom nodes) on short stems sticking out from the left/outer vertices.
  • RIGHT: a tall letter "K" drawn as thin emerald OUTLINES (not solid) — a vertical stroke on the left, plus a separate chevron forming the K's upper and lower arms; the lower arm is a DOUBLE parallel outline.
  • The molecule's right edge and the K's vertical stroke meet at the centre so the two halves read as one unified mark.
Reproduce THIS exact mark — do NOT collapse it into a single plain hexagon with a letter inside.`;

function prompt(name, mg) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  return `IMAGE 1 = an approved Kairo Labs product photo (correct style). IMAGE 2 = the REAL Kairo Labs logo.

Recreate IMAGE 1 EXACTLY in every respect — same clear-glass vial, jet-black crimp cap with brushed-silver collar, matte white wrap label, same bold black "${upper}" product name and font, same emerald "${mgNum} MG" pill, same black-outline "Purity ≥ 99%" chip, same emerald "RESEARCH USE ONLY • VERIFIED PURITY" line, same emerald divider rule, same bright near-white studio background, soft shadow + reflection, square framing, white powder in the vial.

CHANGE ONLY ONE THING: the LOGO at the top of the label must be reproduced to PERFECTLY match IMAGE 2.
${LOGO_DESC}
Render the emerald mark on the left with the black "KAIRO LABS" wordmark beside it, crisp and correctly proportioned, sitting flat on the label.

Photorealistic, tack-sharp, perfectly spelled, no warped/doubled text, no artifacts.`;
}

async function gen(label, name, mg) {
  const parts = [
    { text: prompt(name, mg) },
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

await gen("V4-bpc-a", "BPC-157", "10MG");
await gen("V4-bpc-b", "BPC-157", "10MG");
console.log("done →", OUT);
