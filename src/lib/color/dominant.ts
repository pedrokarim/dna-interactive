"use client";

import { useEffect, useState } from "react";

/**
 * Extraction de la couleur dominante d'une image, côté client.
 *
 * Rendu progressif : le composant s'affiche d'abord avec une couleur de repli
 * (teinte de catégorie), puis se recolore quand l'image est décodée et
 * échantillonnée. Universel — fonctionne aussi bien pour les assets locaux que
 * pour une URL saisie en admin, sans champ en base ni étape de build.
 *
 * Une image tierce non-CORS « souille » le canvas : la lecture jette, on tombe
 * alors sur le repli. Les assets `/assets/…` sont same-origin → toujours lisibles.
 */

const cache = new Map<string, string | null>();

/** Quantifie une couche 0-255 sur 4 bits (16 niveaux) pour regrouper les teintes. */
function bucketKey(r: number, g: number, b: number): number {
  return ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/** Couleur dominante « vibrante » d'une image déjà chargée (via un canvas réduit). */
function extractDominant(image: HTMLImageElement): string | null {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    // Canvas souillé (image cross-origin sans CORS).
    return null;
  }

  // Histogramme pondéré par la saturation : on écarte les gris/noirs/blancs de
  // fond au profit de la vraie teinte de la clé visuelle.
  const buckets = new Map<number, { r: number; g: number; b: number; w: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;

    const sat = saturation(r, g, b);
    const lum = (r + g + b) / 765; // 0..1
    // Poids : privilégie les couleurs saturées et de luminosité moyenne.
    const weight = (0.15 + sat) * (1 - Math.abs(lum - 0.5));
    if (weight <= 0) continue;

    const key = bucketKey(r, g, b);
    const acc = buckets.get(key) ?? { r: 0, g: 0, b: 0, w: 0 };
    acc.r += r * weight;
    acc.g += g * weight;
    acc.b += b * weight;
    acc.w += weight;
    buckets.set(key, acc);
  }

  let best: { r: number; g: number; b: number; w: number } | null = null;
  for (const acc of buckets.values()) {
    if (!best || acc.w > best.w) best = acc;
  }
  if (!best || best.w === 0) return null;

  const r = Math.round(best.r / best.w);
  const g = Math.round(best.g / best.w);
  const b = Math.round(best.b / best.w);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Couleur dominante de `src` (hex), ou `null` tant qu'elle n'est pas résolue /
 * si l'image est illisible. Mémoïsée par URL pour tout le cycle de vie de l'onglet.
 *
 * La valeur est lue directement dans le cache au rendu (aucun `setState` dans le
 * corps de l'effet) ; seul l'aboutissement asynchrone du chargement force un
 * nouveau rendu, qui relit le cache désormais renseigné.
 */
export function useDominantColor(src?: string | null): string | null {
  const [, bump] = useState(0);

  useEffect(() => {
    // Rien à charger : pas de source, ou résultat déjà mémoïsé.
    if (!src || cache.has(src)) return;

    let alive = true;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      cache.set(src, extractDominant(image));
      if (alive) bump((n) => n + 1);
    };
    image.onerror = () => {
      cache.set(src, null);
      if (alive) bump((n) => n + 1);
    };
    image.src = src;

    return () => {
      alive = false;
    };
  }, [src]);

  return src ? cache.get(src) ?? null : null;
}
