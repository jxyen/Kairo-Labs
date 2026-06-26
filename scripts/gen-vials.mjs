// Kairo Labs — branded peptide vial product-image generator
// Uses Gemini 2.5 Flash Image ("nano banana") with the new KAIRO LABS logo
// passed as a brand reference, styled after a premium Downhole-style vial shot.
//
// Usage:
//   node scripts/gen-vials.mjs <slug> "<COMPOUND NAME>" "<MG>"   -> public/products/<slug>.png
//   node scripts/gen-vials.mjs all                                -> generates the full catalog
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "node:fs";
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

const STYLE_REF = path.resolve(new URL("public/_master-vial.png", root).pathname);

const ai = new GoogleGenAI({ apiKey });

// Fill per compound: most are white lyophilized powder; GHK-Cu is copper-blue;
// BAC water is a clear liquid in fully transparent glass.
function fillFor(slug) {
  if (slug === "ghk-cu" || slug === "glow") return "a deep copper-blue lyophilized (freeze-dried) powder cake settled at the bottom";
  if (slug === "bac-water") return "the vial is filled about 85% with CLEAR COLORLESS WATER (bacteriostatic water) — fully transparent glass showing an obvious liquid column with a visible curved meniscus near the top, soft light refracting and reflecting through the water so the liquid reads clearly as water; the filled glass is noticeably brighter and translucent versus the black cap; absolutely NO powder, NO cloudiness";
  return "a small amount of white lyophilized (freeze-dried) powder cake settled at the bottom";
}

function buildPrompt(name, mg, slug) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  const unit = /ML/i.test(mg) ? "ML" : "MG";
  return `Recreate the attached KAIRO LABS research-vial product photo EXACTLY — this is a consistent product LINE, so the bottle must look identical to the reference. Keep the SAME short stubby glass vial shape and size, the SAME CAP (a short black pebbled/wrinkled leather-textured domed crimp cap with a BRIGHT POLISHED SILVER metallic crimp-collar ring around its base — keep the silver collar clearly visible), the SAME label layout and proportions, the SAME molecule-hexagon + "K" KAIRO LABS logo at the top of the label, the SAME clean flat-WHITE bold brand sans-serif (Switzer-style) for the product name, the SAME emerald dose styling, the SAME "RESEARCH PURPOSES ONLY / NOT FOR HUMAN CONSUMPTION" and "LAB TESTED • VERIFIED PURITY" lines, the SAME framing (the WHOLE vial centered with generous even margin all around — full cap at top and full glass base + reflection at bottom, nothing cropped), lighting, reflection and pure-black background. Strict palette: black + white + grey + electric spring-emerald #35E0A0 only.

CHANGE ONLY THESE THREE THINGS:
  1. Product name on the hero band: "${upper}" — ALL CAPS, exact same clean white brand font, sized to fill the same area.
  2. Dose line: "${mgNum}" big in emerald with a small "${unit}" beside it.
  3. Contents inside the vial: ${fillFor(slug)}.

Everything else must match the reference identically. Photorealistic, tack-sharp, text correctly spelled and legible. CRITICAL: the product name must read EXACTLY "${upper}" — every letter a real letter (the letter "C" must be a "C", never the digit "3" or "0"); do not substitute, drop, or alter any character.`;
}

async function gen(slug, name, mg) {
  const prompt = buildPrompt(name, mg, slug);
  const styleData = readFileSync(STYLE_REF).toString("base64");
  const parts = [
    { text: prompt },
    { inlineData: { mimeType: "image/png", data: styleData } },
  ];
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.resolve(new URL(`public/products/${slug}.png`, root).pathname);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
      });
      const outParts = res.candidates?.[0]?.content?.parts || [];
      for (const p of outParts) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug} (${model}) → ${outFile}`);
          return true;
        } else if (p.text) {
          console.log(`[${slug} text] ${p.text.slice(0, 160)}`);
        }
      }
    } catch (e) {
      console.log(`(${slug}/${model}) error: ${e.message?.slice(0, 160)}`);
    }
  }
  console.log(`✗ ${slug} — no image returned`);
  return false;
}

// slug, display name on label, mg shown on label (largest common size)
const CATALOG = [
  ["bpc-157", "BPC-157", "20MG"],
  ["tb-500", "TB-500", "10MG"],
  ["tirzepatide", "Tirzepatide", "10MG"],
  ["retatrutide", "Retatrutide", "10MG"],
  ["mots-c", "MOTS-c", "10MG"],
  ["cjc-1295", "CJC-1295", "10MG"],
  ["ipamorelin", "Ipamorelin", "10MG"],
  ["igf-1-lr3", "IGF-1 LR3", "1MG"],
  ["ghk-cu", "GHK-Cu", "50MG"],
  ["mt-2", "MT-2", "10MG"],
];

const [, , arg, nameArg, mgArg] = process.argv;
if (arg === "all") {
  for (const [slug, name, mg] of CATALOG) {
    await gen(slug, name, mg);
  }
} else if (arg && nameArg && mgArg) {
  await gen(arg, nameArg, mgArg);
} else {
  console.error('Usage: node scripts/gen-vials.mjs <slug> "<NAME>" "<MG>"  |  node scripts/gen-vials.mjs all');
  process.exit(1);
}
