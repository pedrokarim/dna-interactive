import { useState, useEffect } from "react";
import { loadGameMap } from "@/lib/map/load";
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

    let cancelled = false;
    setIsLoading(true);

    loadGameMap(selectedMapId)
      .then((data) => {
        if (cancelled) return;
        if (!data) console.error(`No map loader found for "${selectedMapId}"`);
        else mapDataCache.set(selectedMapId, data);
        setSelectedMap(data);
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
