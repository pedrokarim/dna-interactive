/**
 * Genere les variantes allegees des bustes de personnages, pour la carte de
 * build (`QuickBuildModal`).
 *
 * Pourquoi : les bustes d'origine font 2048x2048 en PNG, soit 2,8 a 4,8 Mo
 * piece, et le dossier pese 110 Mo. La carte les affiche en 300x400 et les
 * exporte en `pixelRatio: 2`, donc 600x800 au maximum. On servait 47 fois plus
 * de pixels que necessaire, et l'accueil, qui montre trois cartes, chargeait
 * 12 Mo a lui seul.
 *
 * Les originaux restent en place : les images Open Graph et la fiche
 * personnage s'en servent en pleine resolution. Cette variante ne concerne
 * que la carte.
 *
 * Le format reste rasterisable par `html-to-image` (WebP passe en canvas comme
 * PNG), donc l'export PNG de la carte continue de fonctionner.
 *
 * Usage : bun run scripts/generate-bust-cards.ts
 * A relancer apres l'ajout d'un personnage.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/assets/characters/bust";
const OUT = "public/assets/characters/bust-card";
const MANIFEST = "src/data/bust-cards.json";

/** 800 px : 2,7x la taille d'affichage, marge confortable pour l'export en 2x. */
const MAX_SIDE = 800;
const QUALITY = 82;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".png"));

  let before = 0;
  let after = 0;

  for (const file of files) {
    const input = path.join(SRC, file);
    const output = path.join(OUT, file.replace(/\.png$/, ".webp"));
    before += fs.statSync(input).size;
    await sharp(input)
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(output);
    after += fs.statSync(output).size;
  }

  const names = fs
    .readdirSync(OUT)
    .filter((f) => f.endsWith(".webp"))
    .map((f) => f.replace(/\.webp$/, ""))
    .sort();
  fs.writeFileSync(MANIFEST, `${JSON.stringify(names, null, 2)}\n`);

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  console.log(`${files.length} bustes convertis`);
  console.log(`  avant : ${mb(before)} Mo`);
  console.log(`  apres : ${mb(after)} Mo`);
  console.log(`  gain  : ${(100 - (after / before) * 100).toFixed(1)} %`);
  console.log(`  manifeste : ${MANIFEST} (${names.length} entrees)`);
}

main();
