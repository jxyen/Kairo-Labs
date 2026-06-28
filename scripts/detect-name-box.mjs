// Detect the dark product-name text bounding box within the label name band,
// so we can deterministically composite a correct-spelling overlay.
import sharp from "sharp";
import path from "node:path";

const root = new URL("..", import.meta.url);
const TRY = path.resolve(new URL("public/_regen/_try", root).pathname);

// name band (centered V4 layout, 1024x1024): between emerald divider and dose pill
const BAND = { x0: 395, x1: 675, y0: 575, y1: 668 };

async function detect(file) {
  const img = sharp(path.join(TRY, file));
  const { width, height } = await img.metadata();
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1, count = 0;
  for (let y = BAND.y0; y < BAND.y1; y++) {
    for (let x = BAND.x0; x < BAND.x1; x++) {
      const i = (y * info.width + x) * ch;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 90) {
        count++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  console.log(file, { width, height, count, box: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } });
  // save a debug crop of the band
  await sharp(path.join(TRY, file))
    .extract({ left: BAND.x0, top: BAND.y0, width: BAND.x1 - BAND.x0, height: BAND.y1 - BAND.y0 })
    .toFile(path.join(TRY, file.replace(".png", "-band.png")));
}

await detect("cjc-1295-4.png");
await detect("cjc-ipa-blend-4.png");
