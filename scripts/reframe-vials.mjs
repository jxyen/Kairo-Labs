// Reframe the generated vials so the FULL bottle sits with breathing room (the
// base was reading as "cut off"). Approach: feed each perfected render straight to
// Gemini with a FORCEFUL zoom-out instruction. Gemini re-renders a coherent scene
// (real seamless studio background, soft shadow + reflection) with the vial smaller
// and centered — no deterministic compositing, so there is no "card"/rectangle
// seam, and the clear glass is handled natively. The exact product name + dose are
// baked into each prompt so the text is preserved, not re-spelled.
//
// Sources from _regen/_prereframe (perfected text/powder set); writes _regen.
// Usage:
//   node scripts/reframe-vials.mjs            -> all
//   node scripts/reframe-vials.mjs <slug...>  -> specific slugs
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const env = readFileSync(new URL(".env.local", root), "utf8");
const apiKey = Object.fromEntries(env.split("\n").filter(Boolean).map((l) => {
  const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
})).GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const OUT = path.resolve(new URL("public/_regen", root).pathname);
const SRC = path.join(OUT, "_prereframe");
const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];

// slug -> [display name, dose, contents-phrase]
const CATALOG = {
  "bpc-157":       ["BPC-157", "20 MG", "thin subtle layer of white powder at the bottom"],
  "tb-500":        ["TB-500", "10 MG", "a fuller, clearly-visible settled layer of fine white lyophilized powder filling the lower portion of the vial behind and below the label so the vial reads as FULL of product (substantial and clearly present, not empty) — still a flat settled layer, no tall mound"],
  "tirzepatide":   ["TIRZEPATIDE", "10 MG", "thin subtle layer of white powder at the bottom"],
  "retatrutide":   ["RETATRUTIDE", "10 MG", "thin subtle layer of white powder at the bottom"],
  "mots-c":        ["MOTS-C", "10 MG", "thin subtle layer of white powder at the bottom"],
  "cjc-1295":      ["CJC-1295", "10 MG", "thin subtle layer of white powder at the bottom"],
  "ipamorelin":    ["IPAMORELIN", "10 MG", "a fuller, clearly-visible settled layer of fine white lyophilized powder filling the lower portion of the vial behind and below the label so the vial reads as FULL of product (substantial and clearly present, not empty) — still a flat settled layer, no tall mound"],
  "igf-1-lr3":     ["IGF-1 LR3", "1 MG", "thin subtle layer of white powder at the bottom"],
  "ghk-cu":        ["GHK-CU", "50 MG", "thin subtle layer of deep copper-blue powder at the bottom"],
  "mt-2":          ["MT-2", "10 MG", "thin subtle layer of white powder at the bottom"],
  "bpc-tb-blend":  ["BPC + TB-500", "20 MG", "thin subtle layer of white powder at the bottom"],
  "cjc-ipa-blend": ["CJC + IPAMORELIN", "10 MG", "thin subtle layer of white powder at the bottom"],
  "glow":          ["GLOW", "70 MG", "thin subtle layer of deep copper-blue powder at the bottom"],
  "bac-water":     ["BAC WATER", "30 ML", "clear colorless bacteriostatic water (a liquid column, no powder)"],
};

function prompt(name, dose, contents) {
  return `Pull the camera BACK and zoom OUT so the vial appears noticeably SMALLER within the square frame. The bottle should occupy only the central ~55% of the image HEIGHT, centered, surrounded by generous empty seamless studio background — and crucially a large empty area of studio floor BELOW the base (at least 20-25% of the frame height must be empty backdrop beneath the bottle). Show the COMPLETE vial with comfortable breathing room above the cap and below the base; do NOT crop it.

Keep the EXACT same vial and label. The product name reads EXACTLY "${name}" (bold black, every character a real letter, keep hyphens/spaces/"+" exactly). The dose pill reads "${dose}". Keep the "Purity >= 99%" chip, the Kairo Labs logo (emerald hexagon-molecule + "K", black "KAIRO LABS" wordmark), the emerald "RESEARCH USE ONLY - VERIFIED PURITY" line, the jet-black cap with brushed-silver collar, and the contents (${contents}). Keep the bright SEAMLESS studio background as one continuous smooth sweep with a soft contact shadow and faint reflection — NO card, NO panel, NO rectangle or platform anywhere.

Do not change, move, restyle, or re-spell any text. ONLY change the zoom/framing so there is more space around and below the bottle. Photorealistic, tack-sharp, perfectly spelled, square 1:1.`;
}

async function reframe(slug) {
  const meta = CATALOG[slug];
  if (!meta) { console.log(`? ${slug} — not in catalog, skipping`); return false; }
  const ref = readFileSync(path.join(SRC, `${slug}.png`)).toString("base64");
  const parts = [{ text: prompt(...meta) }, { inlineData: { mimeType: "image/png", data: ref } }];
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }] });
      for (const p of res.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData?.data) {
          writeFileSync(path.join(OUT, `${slug}.png`), Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug.padEnd(14)} "${meta[0]}" ${meta[1]} via ${model}`);
          return true;
        }
      }
    } catch (e) { console.log(`(${slug}/${model}) ${e.message?.slice(0, 110)}`); }
  }
  console.log(`✗ ${slug} — no image`);
  return false;
}

const args = process.argv.slice(2);
const slugs = args.length ? args : Object.keys(CATALOG);
for (const s of slugs) await reframe(s);
console.log("done →", OUT);
