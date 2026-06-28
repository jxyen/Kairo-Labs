// Measure the dark-cap bounding box in each _prereframe image to quantify how
// consistent the bottle size/position already is (informs normalization params).
import sharp from "sharp";
import path from "node:path";

const root = new URL("..", import.meta.url);
const SRC = path.resolve(new URL("public/_regen/_prereframe", root).pathname);
const SLUGS = ["bpc-157","tb-500","tirzepatide","retatrutide","mots-c","cjc-1295",
  "ipamorelin","igf-1-lr3","ghk-cu","mt-2","bpc-tb-blend","cjc-ipa-blend","glow","bac-water"];

for (const slug of SLUGS) {
  const { data, info } = await sharp(path.join(SRC, `${slug}.png`))
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, ch = info.channels;
  const lum = (x, y) => { const i = (y * W + x) * ch; return 0.299*data[i]+0.587*data[i+1]+0.114*data[i+2]; };
  // cap = dark pixels in the upper 55% of the frame
  let minX=1e9,minY=1e9,maxX=-1,maxY=-1, n=0;
  for (let y=0; y<H*0.55; y++) for (let x=0; x<W; x++) {
    if (lum(x,y) < 75) { n++; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  }
  const cw = maxX-minX, cx = Math.round((minX+maxX)/2);
  console.log(`${slug.padEnd(14)} capTop=${minY}  capCenterX=${cx}  capW=${cw}  capBot=${maxY}  n=${n}`);
}
