// Batch: render ALL catalog vials tight + hi-res from the universal tight ref,
// so each cutout is high-resolution and the whole line stays identical.
// Output: public/products/hires/<slug>.png   (then run the python cutout pass)
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = new URL("..", import.meta.url);
const env = Object.fromEntries(
  readFileSync(new URL(".env.local", root), "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const REF = path.resolve(new URL("public/_tight-ref.png", root).pathname);
const OUT = path.resolve(new URL("public/products/hires", root).pathname);
mkdirSync(OUT, { recursive: true });

function fillFor(slug) {
  if (slug === "ghk-cu" || slug === "glow") return "a deep copper-blue lyophilized (freeze-dried) powder cake settled at the bottom";
  return "a small amount of white lyophilized (freeze-dried) powder cake settled at the bottom";
}
function prompt(name, mg, slug) {
  const upper = name.toUpperCase();
  const mgNum = mg.replace(/MG|ML/i, "").trim();
  const unit = /ML/i.test(mg) ? "ML" : "MG";
  return `Recreate the attached KAIRO LABS research vial EXACTLY — same bottle, same short black pebbled leather-textured domed crimp cap with a BRIGHT POLISHED SILVER metallic crimp-collar ring at its base, same black hero label with the molecule-hexagon + "K" KAIRO LABS logo at top, product name in clean flat-WHITE bold Switzer-style sans, dose in electric spring-emerald #35E0A0, and the "LAB TESTED • VERIFIED PURITY" line. Strict palette: black + white + grey + electric spring-emerald #35E0A0 only.

FRAMING: keep the vial UPRIGHT and TIGHT exactly like the reference — the bottle fills about 90% of the frame height, centered, the ENTIRE vial visible (full cap and full glass base, nothing cropped). MAXIMUM detail and resolution, tack-sharp edge to edge, crisp legible label text. Smooth dark near-black studio background with soft even falloff. No reflection floor, no props, no text anywhere except on the label.

CHANGE ONLY: product name reads EXACTLY "${upper}" in ALL CAPS white (every character a real letter — a "C" is a "C", never a 3 or 0); dose "${mgNum}" big in emerald with a small "${unit}" beside it; inside the vial ${fillFor(slug)}.

Photorealistic, ultra-sharp, high-resolution studio product photography.`;
}

// slug, label name on vial (blend names shortened to avoid mis-spelling), mg
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
  ["bpc-tb-blend", "BPC + TB-500", "20MG"],
  ["cjc-ipa-blend", "CJC + IPAMORELIN", "10MG"],
  ["glow", "GLOW", "70MG"],
];

const refData = readFileSync(REF).toString("base64");
for (const [slug, name, mg] of CATALOG) {
  // skip retatrutide — already rendered as the approved sample
  if (slug === "retatrutide") { console.log(`· ${slug} (skip, already done)`); continue; }
  const parts = [
    { text: prompt(name, mg, slug) },
    { inlineData: { mimeType: "image/png", data: refData } },
  ];
  let ok = false;
  for (const model of ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"]) {
    if (ok) break;
    try {
      const res = await ai.models.generateContent({ model, contents: [{ role: "user", parts }], config: { imageConfig: { aspectRatio: "3:4" } } });
      for (const p of res.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData?.data) {
          writeFileSync(path.join(OUT, `${slug}.png`), Buffer.from(p.inlineData.data, "base64"));
          console.log(`✓ ${slug} (${model})`);
          ok = true; break;
        }
      }
    } catch (e) { console.log(`(${slug}/${model}) ${e.message?.slice(0, 120)}`); }
  }
  if (!ok) console.log(`✗ ${slug} — FAILED`);
}
console.log("done");
