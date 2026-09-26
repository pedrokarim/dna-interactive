"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useAtom } from "jotai";
import { markedMarkersAtom } from "@/lib/store";
import { personalMarkersAtom, type PersonalMarker } from "@/lib/map/personal";
import { TRACKED_INDEX } from "@/lib/map/world";

export type SyncStatus = "anonymous" | "loading" | "synced" | "saving" | "error";

/** Compte dont la progression locale est le reflet (évite de mêler deux comptes). */
const SYNCED_USER_KEY = "map:synced-user";
/** Vrai tant qu'un changement local n'a pas été accepté par le serveur. */
const DIRTY_KEY = "map:sync-dirty";
const SAVE_DELAY_MS = 1500;
/** Clés localStorage des atomes (voir `@/lib/store` et `@/lib/map/personal`). */
const FOUND_KEY = "marked-markers";
const PERSONAL_KEY = "map:personal-markers";
/** Copies de la progression locale prises avant tout remplacement (3 dernières). */
const BACKUP_KEY = "map:progress-backups";

/** Points qui comptent dans l'exploration : les seuls que le serveur conserve. */
const TRACKED_KEYS = new Set(Object.values(TRACKED_INDEX).flatMap((m) => Object.values(m).flat()));

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

/** Tableau lu directement dans le localStorage (vide si absent ou illisible). */
function readArray<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

/** Garde une copie de la progression locale avant de la remplacer. */
function backupLocal(found: string[], personal: PersonalMarker[]) {
  if (found.length === 0 && personal.length === 0) return;
  const backups = readArray<{ at: string }>(BACKUP_KEY).slice(-2);
  backups.push({ at: new Date().toISOString(), found, personal } as { at: string });
  write(BACKUP_KEY, JSON.stringify(backups));
}

/**
 * Synchronise la progression de la carte (points trouvés + marqueurs
 * personnels) avec le compte connecté.
 *
 * - Premier chargement pour ce compte, ou changements locaux non envoyés :
 *   **union** du local et du serveur (on ne perd jamais une coche).
 * - Sinon, le serveur fait foi : une coche retirée sur un autre appareil
 *   disparaît aussi ici.
 * - Ensuite, chaque changement part au serveur après un court délai.
 *
 * ==La progression locale est lue DIRECTEMENT dans le localStorage==, jamais
 * dans l'atome : au premier rendu, `atomWithStorage` renvoie sa valeur initiale
 * (vide) tant qu'il n'a pas lu le stockage. Fusionner avec cette valeur a
 * remis à zéro la progression d'un joueur le 25/09/2026 (vide ∪ vide = vide,
 * écrit en local puis sur le compte).
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
        const localFound = readArray<string>(FOUND_KEY);
        const localPersonal = readArray<PersonalMarker>(PERSONAL_KEY);
        // Serveur vide alors que le navigateur ne l'est pas : on ne remplace
        // jamais par du vide, on fusionne.
        const serverEmpty = server.foundKeys.length === 0 && server.personalMarkers.length === 0;
        const merge =
          read(SYNCED_USER_KEY) !== userId || read(DIRTY_KEY) === "1" || serverEmpty;
        if (!merge) backupLocal(localFound, localPersonal);
        // Le serveur ne garde que les points suivis : les coches des autres types
        // (ressources, géniemons…) restent celles du navigateur.
        const untracked = localFound.filter((k) => !TRACKED_KEYS.has(k));
        const nextFound = merge
          ? new Set([...localFound, ...server.foundKeys])
          : new Set([...server.foundKeys, ...untracked]);
        const byId = new Map<string, PersonalMarker>();
        for (const m of server.personalMarkers) byId.set(m.id, m);
        if (merge) for (const m of localPersonal) if (!byId.has(m.id)) byId.set(m.id, m);
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
