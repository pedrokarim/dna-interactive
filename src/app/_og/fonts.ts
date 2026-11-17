import { readFile } from "node:fs/promises";

/**
 * Polices DNA pour le rendu Satori (`next/og`).
 * Les .ttf sont à côté (`./fonts/*`) et lues via `import.meta.url` : comme ça
 * Next les trace et les embarque dans le serveur autonome.
 *
 * Cinzel pour les titres, Jost pour le reste. Ce sont des fontes variables,
 * Satori prend l'instance par défaut : on déclare juste la graisse voulue.
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

/** Format OG standard (1.91:1), commun à toutes les routes image. */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;
