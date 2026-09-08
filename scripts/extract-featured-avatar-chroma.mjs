import sharp from "sharp";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error(
    "Usage: bun scripts/extract-featured-avatar-chroma.mjs <input-green.png> <output-transparent.png>",
  );
  process.exit(1);
}

const { data, info } = await sharp(inputPath)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixelCount = info.width * info.height;
let backgroundR = 0;
let backgroundG = 0;
let backgroundB = 0;
let backgroundSamples = 0;

for (let index = 0; index < pixelCount; index += 1) {
  const offset = index * 3;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const greenDominance = g - Math.max(r, b);

  if (g >= 210 && greenDominance >= 180) {
    backgroundR += r;
    backgroundG += g;
    backgroundB += b;
    backgroundSamples += 1;
  }
}

if (backgroundSamples === 0) {
  throw new Error(
    "No chroma-green background found. The input must use a uniform #00FF00 background.",
  );
}

backgroundR /= backgroundSamples;
backgroundG /= backgroundSamples;
backgroundB /= backgroundSamples;

const backgroundDominance =
  backgroundG - Math.max(backgroundR, backgroundB);
const output = Buffer.alloc(pixelCount * 4);

let transparentPixels = 0;
let partialPixels = 0;
let opaquePixels = 0;

for (let index = 0; index < pixelCount; index += 1) {
  const sourceOffset = index * 3;
  const outputOffset = index * 4;
  const r = data[sourceOffset];
  const g = data[sourceOffset + 1];
  const b = data[sourceOffset + 2];
  const greenDominance = g - Math.max(r, b);
  const rawAlpha = Math.max(
    0,
    Math.min(1, 1 - greenDominance / backgroundDominance),
  );

  const isStrongChromaGreen = g >= 190 && greenDominance >= 100;
  const alphaByte = isStrongChromaGreen
    ? 0
    : rawAlpha <= 0.025
      ? 0
      : rawAlpha >= 0.985
        ? 255
        : Math.round(rawAlpha * 255);

  if (alphaByte === 0) {
    output[outputOffset] = 0;
    output[outputOffset + 1] = 0;
    output[outputOffset + 2] = 0;
    output[outputOffset + 3] = 0;
    transparentPixels += 1;
    continue;
  }

  let foregroundR = r;
  let foregroundG = g;
  let foregroundB = b;

  if (alphaByte < 255) {
    foregroundR = (r - (1 - rawAlpha) * backgroundR) / rawAlpha;
    foregroundG = (g - (1 - rawAlpha) * backgroundG) / rawAlpha;
    foregroundB = (b - (1 - rawAlpha) * backgroundB) / rawAlpha;
    foregroundG = Math.min(
      foregroundG,
      Math.max(foregroundR, foregroundB) + 8,
    );
    partialPixels += 1;
  } else {
    opaquePixels += 1;
  }

  output[outputOffset] = Math.max(0, Math.min(255, Math.round(foregroundR)));
  output[outputOffset + 1] = Math.max(
    0,
    Math.min(255, Math.round(foregroundG)),
  );
  output[outputOffset + 2] = Math.max(
    0,
    Math.min(255, Math.round(foregroundB)),
  );
  output[outputOffset + 3] = alphaByte;
}

await sharp(output, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(
  JSON.stringify({
    width: info.width,
    height: info.height,
    background: [backgroundR, backgroundG, backgroundB],
    backgroundSamples,
    transparentPixels,
    partialPixels,
    opaquePixels,
    outputPath,
  }),
);
