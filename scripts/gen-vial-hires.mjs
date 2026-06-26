// Kairo Labs — HI-RES TIGHT vial render for clean cutouts.
// Renders the Kairo vial filling the frame (minimal margin) at max detail on a
// smooth dark studio backdrop, so a rembg cutout comes out high-resolution and
// crisp enough for a large desktop hero. Output: public/products/hires/<slug>.png
//
// Usage: node scripts/gen-vial-hires.mjs <slug> "<NAME>" "<MG>"
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

const STYLE_REF = path.resolve(new URL(process.env.REF || "public/_master-vial.png", root).pathname);
const OUT_DIR = path.resolve(new URL("public/products/hires", root).pathname);
mkdirSync(OUT_DIR, { recursive: true });
const ai = new GoogleGenAI({ apiKey });

function fillFor(slug) {
  if (slug === "ghk-cu" || slug === "glow") return "a deep copper-blue lyophilized (freeze-dried) powder cake settled at the bottom";
  return "a small amount of white lyophilized (freeze-dried) powder cake settled at the bottom";
}

function buildPrompt(name, mg, slug) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  const unit = /ML/i.test(mg) ? "ML" : "MG";
  return `Recreate the attached KAIRO LABS research vial EXACTLY — same bottle, same short black pebbled leather-textured domed crimp cap with a BRIGHT POLISHED SILVER metallic crimp-collar ring at its base, same black hero label with the molecule-hexagon + "K" KAIRO LABS logo at top, product name in clean flat-WHITE bold Switzer-style sans, dose in electric spring-emerald #35E0A0, and the "LAB TESTED • VERIFIED PURITY" line. Strict palette: black + white + grey + electric spring-emerald #35E0A0 only.

FRAMING — this is the key change: shoot the vial UPRIGHT and TIGHT so the bottle fills about 90% of the frame height, perfectly centered with only a small even margin, the ENTIRE vial visible (full cap at top, full glass base at bottom — nothing cropped). MAXIMUM detail and resolution, tack-sharp focus edge to edge, crisp legible label text, fine cap leather texture and glass highlights all razor sharp. Smooth dark near-black studio background with a soft even falloff (clean enough to mask out cleanly). No reflection floor, no props, no text anywhere except on the label.

CHANGE ONLY: product name reads EXACTLY "${upper}" in ALL CAPS white (every character a real letter — a "C" is a "C", never a 3 or 0); dose "${mgNum}" big in emerald with a small "${unit}" beside it; inside the vial ${fillFor(slug)}.

Photorealistic, ultra-sharp, high-resolution studio product photography.`;
}

async function gen(slug, name, mg) {
  const prompt = buildPrompt(name, mg, slug);
  const styleData = readFileSync(STYLE_REF).toString("base64");
  const parts = [
    { text: prompt },
    { inlineData: { mimeType: "image/png", data: styleData } },
  ];
  const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
  const outFile = path.join(OUT_DIR, `${slug}.png`);
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { imageConfig: { aspectRatio: "3:4" } },
      });
      const outParts = res.candidates?.[0]?.content?.parts || [];
      for (const p of outParts) {
        if (p.inlineData?.data) {
          writeFileSync(outFile, Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug} (${model}) → ${outFile}`);
          return true;
        } else if (p.text) {
          console.log(`[${slug} text] ${p.text.slice(0, 140)}`);
        }
      }
    } catch (e) {
      console.log(`(${slug}/${model}) error: ${e.message?.slice(0, 200)}`);
    }
  }
  console.log(`✗ ${slug} — no image returned`);
  return false;
}

const [, , slug, nameArg, mgArg] = process.argv;
if (!slug || !nameArg || !mgArg) {
  console.error('Usage: node scripts/gen-vial-hires.mjs <slug> "<NAME>" "<MG>"');
  process.exit(1);
}
await gen(slug, nameArg, mgArg);
