"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useAtom } from "jotai";
import { markedMarkersAtom } from "@/lib/store";
import { personalMarkersAtom, type PersonalMarker } from "@/lib/map/personal";

export type SyncStatus = "anonymous" | "loading" | "synced" | "saving" | "error";

/** Compte dont la progression locale est le reflet (évite de mêler deux comptes). */
const SYNCED_USER_KEY = "map:synced-user";
/** Vrai tant qu'un changement local n'a pas été accepté par le serveur. */
const DIRTY_KEY = "map:sync-dirty";
const SAVE_DELAY_MS = 1500;

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
};

/**
 * Synchronise la progression de la carte (points trouvés + marqueurs
 * personnels) avec le compte connecté.
 *
 * - Premier chargement pour ce compte, ou changements locaux non envoyés :
 *   **union** du local et du serveur (on ne perd jamais une coche).
 * - Sinon, le serveur fait foi : une coche retirée sur un autre appareil
 *   disparaît aussi ici.
 * - Ensuite, chaque changement part au serveur après un court délai.
 */
export function useProgressSync(): SyncStatus {
  const { data: session, status: authStatus } = useSession();
  const userId = session?.user?.id ?? null;
  const [marked, setMarked] = useAtom(markedMarkersAtom);
  const [personal, setPersonal] = useAtom(personalMarkersAtom);
  const [status, setStatus] = useState<SyncStatus>("anonymous");
  const hydratedFor = useRef<string | null>(null);
  const skipNextSave = useRef(false);

  // Chargement / fusion à la connexion.
  useEffect(() => {
    if (authStatus !== "authenticated" || !userId || hydratedFor.current === userId) return;
    let cancelled = false;
    setStatus("loading");
    fetch("/api/map/progress", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((server: { foundKeys: string[]; personalMarkers: PersonalMarker[] }) => {
        if (cancelled) return;
        const merge = read(SYNCED_USER_KEY) !== userId || read(DIRTY_KEY) === "1";
        const nextFound = merge ? new Set([...marked, ...server.foundKeys]) : new Set(server.foundKeys);
        const byId = new Map<string, PersonalMarker>();
        for (const m of server.personalMarkers) byId.set(m.id, m);
        if (merge) for (const m of personal) if (!byId.has(m.id)) byId.set(m.id, m);
        // Pas de renvoi immédiat si l'état vient tel quel du serveur.
        skipNextSave.current = !merge;
        setMarked(nextFound);
        setPersonal([...byId.values()]);
        write(SYNCED_USER_KEY, userId);
        if (merge) write(DIRTY_KEY, "1");
        hydratedFor.current = userId;
        setStatus("synced");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois par compte
  }, [authStatus, userId]);

  // Envoi différé de chaque changement.
  useEffect(() => {
    if (!userId || hydratedFor.current !== userId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    write(DIRTY_KEY, "1");
    setStatus("saving");
    const timer = setTimeout(() => {
      fetch("/api/map/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foundKeys: [...marked], personalMarkers: personal }),
      })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          write(DIRTY_KEY, null);
          setStatus("synced");
        })
        .catch(() => setStatus("error"));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [marked, personal, userId]);

  if (authStatus !== "authenticated") return "anonymous";
  return status;
}
