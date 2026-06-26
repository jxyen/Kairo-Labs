// Kairo Labs — product image generator (Gemini 2.5 Flash Image / "nano banana")
// Usage: node scripts/gen.mjs <outfile> "<prompt>"  [refImage1 refImage2 ...]
import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// --- load GEMINI_API_KEY from .env.local ---
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const apiKey = Object.fromEntries(
  envText.split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
).GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY not found in .env.local");

const [, , outFile, prompt, ...refs] = process.argv;
if (!outFile || !prompt) {
  console.error('Usage: node scripts/gen.mjs <outfile> "<prompt>" [ref...]');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const parts = [{ text: prompt }];
for (const r of refs) {
  const data = readFileSync(r).toString("base64");
  const mimeType = r.endsWith(".png") ? "image/png" : "image/jpeg";
  parts.push({ inlineData: { mimeType, data } });
}

const MODELS = ["gemini-2.5-flash-image", "gemini-2.5-flash-image-preview"];
let saved = false;
for (const model of MODELS) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
    });
    const cand = res.candidates?.[0];
    const outParts = cand?.content?.parts || [];
    for (const p of outParts) {
      if (p.inlineData?.data) {
        writeFileSync(path.resolve(outFile), Buffer.from(p.inlineData.data, "base64"));
        console.log(`✓ ${model} → ${outFile}`);
        saved = true;
      } else if (p.text) {
        console.log(`[model text] ${p.text.slice(0, 300)}`);
      }
    }
    if (saved) break;
    console.log(`(${model}) returned no image; finishReason=${cand?.finishReason}`);
  } catch (e) {
    console.log(`(${model}) error: ${e.message?.slice(0, 200)}`);
  }
}
if (!saved) process.exit(2);
