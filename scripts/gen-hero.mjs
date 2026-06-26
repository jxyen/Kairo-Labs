// Kairo Labs — HERO SCENE product-image generator
// Renders the Kairo black vial floating FLUSH on a baked emerald-green studio
// gradient (vial + glow + glossy reflective floor as one continuous scene),
// styled after the Sermorelin/GLP-1 reference cards but in Kairo's emerald palette.
//
// Two compositions per product:
//   desktop  -> wide 16:9, vial on the RIGHT, dark negative space on the LEFT
//   mobile   -> tall 3:4, vial UPPER-CENTER, dark negative space toward the BOTTOM
//
// Text (pill / headline / button) is NOT baked — it is HTML overlaid on top.
//
// Usage:
//   node scripts/gen-hero.mjs <slug> "<NAME>" "<MG>" <desktop|mobile|both>
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

const STYLE_REF = path.resolve(new URL("public/_master-vial.png", root).pathname);
const OUT_DIR = path.resolve(new URL("public/products/hero", root).pathname);
mkdirSync(OUT_DIR, { recursive: true });

const ai = new GoogleGenAI({ apiKey });

function fillFor(slug) {
  if (slug === "ghk-cu" || slug === "glow") return "a deep copper-blue lyophilized (freeze-dried) powder cake settled at the bottom";
  return "a small amount of white lyophilized (freeze-dried) powder cake settled at the bottom";
}

// Shared description of the bottle identity — must stay identical across the line.
const BOTTLE = `The product is the KAIRO LABS research vial from the attached reference: keep the SAME short stubby clear-glass vial, the SAME short black pebbled leather-textured domed crimp cap with a BRIGHT POLISHED SILVER metallic crimp-collar ring at its base, the SAME black hero label with the molecule-hexagon + "K" KAIRO LABS logo at top, the product name in clean flat-WHITE bold Switzer-style sans, the dose in electric spring-emerald #35E0A0, and the "LAB TESTED • VERIFIED PURITY" line. The bottle must look IDENTICAL to the reference — do not redesign it.`;

const PALETTE = `Strict emerald palette only — deep near-black green, rich emerald greens (#0a5e41, #12a36f), electric spring-emerald #35E0A0 highlights, and a luminous pale mint-white floor glow. NO blue, NO purple, NO other hues anywhere in the scene.`;

function buildPrompt(name, mg, slug, orient) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  const unit = /ML/i.test(mg) ? "ML" : "MG";
  const label = `On the label the product name reads EXACTLY "${upper}" in ALL CAPS white (every character a real letter — a "C" is a "C", never a 3 or 0), with "${mgNum}" large in emerald and a small "${unit}" beside it. Inside the vial: ${fillFor(slug)}.`;

  const composition = orient === "desktop"
    ? `WIDE LANDSCAPE hero scene. ONE single vial floating in mid-air, dramatically tilted about 14 degrees, pushed clearly into the RIGHT THIRD of the frame (base toward lower-right, cap toward upper-right). The LEFT 55% of the frame is deliberately EMPTY — deep near-black green with no objects, no glare, no reflections — clean negative space reserved for headline text.`
    : `TALL PORTRAIT hero scene. ONE single vial floating in mid-air, tilted about 10 degrees, pushed into the UPPER-CENTER (roughly the top 55%) so its glossy floor reflection sits mid-frame. The BOTTOM third of the frame is deliberately EMPTY deep near-black green negative space reserved for headline text — keep it clean and dark.`;

  return `Ultra-premium photorealistic studio product hero shot, HIGH CONTRAST and dramatic, like a flagship biotech / Apple product render. ${composition}

${BOTTLE}

BACKGROUND & LIGHT — this is the most important thing: the vial sits FLUSH inside ONE single continuous studio gradient (there is NO separate flat backdrop behind a cutout — the bottle is lit by, reflected in, and grounded in the same scene). Make the gradient DRAMATIC with real depth, not flat: the negative-space region falls to deep near-black green (#020e0a), then blooms through a VIVID electric emerald glow (#12a36f into bright #35E0A0) wrapping around and behind the vial like a backlight, and brightens to a luminous near-white mint glossy REFLECTIVE FLOOR directly beneath the vial, where it casts a clean, realistic, softly-blurred mirror reflection and a tight contact glow. Crisp emerald rim-light traces the silver crimp collar and the glass edges so the bottle pops off the dark side. Smooth, expensive, no banding.

${PALETTE}

${label}

Photoreal, tack-sharp focus on the vial, smooth gradient with no banding, no extra props, no watermark, no UI, no text anywhere except on the vial label itself.`;
}

async function gen(slug, name, mg, orient) {
  const prompt = buildPrompt(name, mg, slug, orient);
  const styleData = readFileSync(STYLE_REF).toString("base64");
  const parts = [
    { text: prompt },
    { inlineData: { mimeType: "image/png", data: styleData } },
  ];
  const aspectRatio = orient === "desktop" ? "16:9" : "3:4";
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.join(OUT_DIR, `${slug}-${orient}.png`);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { imageConfig: { aspectRatio } },
      });
      const outParts = res.candidates?.[0]?.content?.parts || [];
      for (const p of outParts) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug}-${orient} (${model}, ${aspectRatio}) → ${outFile}`);
          return true;
        } else if (p.text) {
          console.log(`[${slug}-${orient} text] ${p.text.slice(0, 160)}`);
        }
      }
    } catch (e) {
      console.log(`(${slug}-${orient}/${model}) error: ${e.message?.slice(0, 200)}`);
    }
  }
  console.log(`✗ ${slug}-${orient} — no image returned`);
  return false;
}

const [, , slug, nameArg, mgArg, orientArg = "both"] = process.argv;
if (!slug || !nameArg || !mgArg) {
  console.error('Usage: node scripts/gen-hero.mjs <slug> "<NAME>" "<MG>" <desktop|mobile|both>');
  process.exit(1);
}
const orients = orientArg === "both" ? ["desktop", "mobile"] : [orientArg];
for (const o of orients) {
  await gen(slug, nameArg, mgArg, o);
}
