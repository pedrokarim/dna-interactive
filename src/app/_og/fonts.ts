import { readFile } from "node:fs/promises";

/**
 * Charge les polices du design system DNA pour le rendu Satori (`next/og`).
 * Les .ttf sont colocalisées (`./fonts/*`) afin que Next trace les fichiers et
 * les embarque dans le bundle serverless (lecture via `import.meta.url`).
 *
 * Cinzel = titres gravés, Jost = UI. Variables fonts : Satori utilise
 * l'instance par défaut, on déclare juste les graisses logiques.
 */
export async function loadOgFonts() {
  const [cinzel, jost] = await Promise.all([
    readFile(new URL("./fonts/Cinzel.ttf", import.meta.url)),
    readFile(new URL("./fonts/Jost.ttf", import.meta.url)),
  ]);

  return [
    { name: "Cinzel", data: cinzel, weight: 700 as const, style: "normal" as const },
    { name: "Jost", data: jost, weight: 400 as const, style: "normal" as const },
  ];
}

/** Dimensions OG standard (1.91:1) partagées par toutes les routes image. */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;
