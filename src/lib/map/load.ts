/**
 * Chargement d'une carte complète : relevé boarhat + points complémentaires
 * tirés du jeu (`src/data/maps/game/`), que `normalizeMap` fusionne.
 *
 * Les deux sources restent dans des fichiers séparés : le pipeline boarhat
 * réécrit `src/data/maps/<carte>.json` et son barrel, il ne doit pas effacer
 * les points ajoutés.
 */

import mapLoaders from "@/data/maps";
import gamePointLoaders from "@/data/maps/game";
import type { GameMap, GamePointsFile } from "@/types/map";

export async function loadGameMap(id: string): Promise<GameMap | null> {
  const loader = mapLoaders[id];
  if (!loader) return null;
  const gameLoader = gamePointLoaders[id];
  const [map, game] = await Promise.all([loader(), gameLoader ? gameLoader() : Promise.resolve(null)]);
  const data = map.default as GameMap;
  return game ? { ...data, gamePoints: game.default as GamePointsFile } : data;
}
