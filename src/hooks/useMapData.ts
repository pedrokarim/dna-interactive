import { useState, useEffect } from "react";
import mapLoaders from "@/data/maps";
import type { GameMap } from "@/types/map";

const mapDataCache = new Map<string, GameMap>();

export function useMapData(selectedMapId: string | null) {
  const [selectedMap, setSelectedMap] = useState<GameMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedMapId) {
      setSelectedMap(null);
      return;
    }

    // Check cache first
    const cached = mapDataCache.get(selectedMapId);
    if (cached) {
      setSelectedMap(cached);
      return;
    }

    const loader = mapLoaders[selectedMapId];
    if (!loader) {
      console.error(`No map loader found for "${selectedMapId}"`);
      setSelectedMap(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    loader()
      .then((module) => {
        if (!cancelled) {
          const data = module.default as GameMap;
          mapDataCache.set(selectedMapId, data);
          setSelectedMap(data);
        }
      })
      .catch((err) => {
        console.error(`Failed to load map data for ${selectedMapId}:`, err);
        if (!cancelled) setSelectedMap(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMapId]);

  return { selectedMap, isLoading };
}
