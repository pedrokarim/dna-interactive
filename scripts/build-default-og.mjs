import { access, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const WIDTH = 1200;
const HEIGHT = 630;
const OVERSCAN = 64;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

const backgroundPath = path.join(
  repositoryRoot,
  "public/assets/official-v1.3/bg.webp",
);
const logoPath = path.join(
  repositoryRoot,
  "public/assets/images/logo_optimized.png",
);
const fontPath = path.join(repositoryRoot, "src/app/_og/fonts/Cinzel.ttf");
const outputPath = path.join(
  repositoryRoot,
  "public/assets/og/og-default.png",
);

function svgBuffer(content) {
  return Buffer.from(content);
}

async function renderText({
  text,
  size,
  color,
  letterSpacing = 0,
  width = 1000,
}) {
  const letterSpacingMarkup =
    letterSpacing > 0 ? ` letter_spacing="${letterSpacing * 1024}"` : "";

  return sharp({
    text: {
      text: `<span foreground="${color}"${letterSpacingMarkup}>${text}</span>`,
      font: `Cinzel ${size}`,
      fontfile: fontPath,
      width,
      align: "left",
      dpi: 96,
      rgba: true,
    },
  })
    .trim()
    .png()
    .toBuffer();
}

async function buildDefaultOg() {
  await mkdir(path.dirname(outputPath), { recursive: true });

  const background = await sharp(backgroundPath)
    .resize(WIDTH + OVERSCAN * 2, HEIGHT + OVERSCAN * 2, {
      fit: "cover",
      position: "centre",
    })
    .blur(32)
    .extract({
      left: OVERSCAN,
      top: OVERSCAN,
      width: WIDTH,
      height: HEIGHT,
    })
    .toBuffer();

  const logo = await sharp(logoPath)
    .resize({ height: 120, withoutEnlargement: true })
    .png()
    .toBuffer();

  const [logoMetadata, wordmark, subtitle] = await Promise.all([
    sharp(logo).metadata(),
    renderText({
      text: "DNA Interactive",
      size: 72,
      color: "#f4efe6",
      letterSpacing: 1.5,
    }),
    renderText({
      text: "INTERACTIVE MAP &amp; RESOURCES",
      size: 25,
      color: "#aaa3b5",
      letterSpacing: 4,
      width: 800,
    }),
  ]);

  const [wordmarkMetadata, subtitleMetadata] = await Promise.all([
    sharp(wordmark).metadata(),
    sharp(subtitle).metadata(),
  ]);

  const logoWidth = logoMetadata.width ?? 120;
  const logoHeight = logoMetadata.height ?? 120;
  const wordmarkWidth = wordmarkMetadata.width ?? 680;
  const wordmarkHeight = wordmarkMetadata.height ?? 90;
  const subtitleWidth = subtitleMetadata.width ?? 500;
  const subtitleHeight = subtitleMetadata.height ?? 36;

  const lockupGap = 30;
  const lockupWidth = logoWidth + lockupGap + wordmarkWidth;
  const lockupHeight = Math.max(logoHeight, wordmarkHeight);
  const lockupLeft = Math.round((WIDTH - lockupWidth) / 2);
  const lockupTop = Math.round((HEIGHT - lockupHeight) / 2 - 20);
  const logoTop = lockupTop + Math.round((lockupHeight - logoHeight) / 2);
  const wordmarkTop =
    lockupTop + Math.round((lockupHeight - wordmarkHeight) / 2);
  const subtitleTop = lockupTop + lockupHeight + 30;

  if (lockupLeft < 60 || lockupLeft + lockupWidth > WIDTH - 60) {
    throw new Error(
      `Le lockup dépasse la zone de sécurité: ${lockupWidth}px de large.`,
    );
  }

  const fullSurfaceOverlay = svgBuffer(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="halo" cx="50%" cy="49%" r="47%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.18"/>
          <stop offset="48%" stop-color="#6366f1" stop-opacity="0.07"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
          <stop offset="45%" stop-color="#0b0a0f" stop-opacity="0"/>
          <stop offset="78%" stop-color="#0b0a0f" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#050407" stop-opacity="0.68"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#0b0a0f" fill-opacity="0.58"/>
      <rect width="100%" height="100%" fill="url(#halo)"/>
      <rect width="100%" height="100%" fill="url(#vignette)"/>
    </svg>
  `);

  await sharp(background)
    .composite([
      { input: fullSurfaceOverlay, left: 0, top: 0 },
      { input: logo, left: lockupLeft, top: logoTop },
      {
        input: wordmark,
        left: lockupLeft + logoWidth + lockupGap,
        top: wordmarkTop,
      },
      {
        input: subtitle,
        left: Math.round((WIDTH - subtitleWidth) / 2),
        top: subtitleTop,
      },
    ])
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      colours: 256,
      dither: 0.8,
      effort: 10,
    })
    .toFile(outputPath);

  const [outputMetadata, outputStats] = await Promise.all([
    sharp(outputPath).metadata(),
    stat(outputPath),
  ]);

  if (outputMetadata.width !== WIDTH || outputMetadata.height !== HEIGHT) {
    throw new Error(
      `Dimensions inattendues: ${outputMetadata.width}×${outputMetadata.height}.`,
    );
  }

  const sizeInKilobytes = (outputStats.size / 1024).toFixed(1);
  console.log(`Image générée: ${outputPath}`);
  console.log(
    `Dimensions: ${outputMetadata.width}×${outputMetadata.height} px`,
  );
  console.log(`Taille: ${sizeInKilobytes} Ko`);
}

await Promise.all([
  access(backgroundPath),
  access(logoPath),
  access(fontPath),
]);
await buildDefaultOg();
