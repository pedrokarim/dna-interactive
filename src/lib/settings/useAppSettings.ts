"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "./index";

// Cache module-level : un seul fetch partagé entre tous les composants.
let cache: AppSettings | null = null;
let inflight: Promise<AppSettings> | null = null;

function fetchSettings(): Promise<AppSettings> {
  if (!inflight) {
    inflight = fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        cache = (json?.settings as AppSettings | undefined) ?? DEFAULT_SETTINGS;
        return cache;
      })
      .catch(() => {
        cache = DEFAULT_SETTINGS;
        return cache;
      });
  }
  return inflight;
}

/** Réglages publics côté client (bannière, visibilités…). Défauts tant que non chargés. */
export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(cache ?? DEFAULT_SETTINGS);
  useEffect(() => {
    if (cache) {
      setSettings(cache);
      return;
    }
    let alive = true;
    void fetchSettings().then((v) => {
      if (alive) setSettings(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  return settings;
}
