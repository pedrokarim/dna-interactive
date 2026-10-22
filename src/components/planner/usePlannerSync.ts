"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useAtom } from "jotai";
import { isEmptyPlan, mergePlans } from "@/lib/planner/builds";
import { readPlannerState } from "@/lib/planner/schema";
import { PLANNER_STORAGE_KEY, plannerStateAtom } from "@/lib/planner/store";
import type { PlannerState } from "@/lib/planner/types";

export type PlannerSyncStatus = "anonymous" | "loading" | "synced" | "saving" | "error" | "unavailable";

/** Compte dont le plan local est le reflet (évite de mêler deux comptes). */
const SYNCED_USER_KEY = "planner:synced-user";
/** Vrai tant qu'un changement local n'a pas été accepté par le serveur. */
const DIRTY_KEY = "planner:sync-dirty";
/** Copies du plan local prises avant tout remplacement (3 dernières). */
const BACKUP_KEY = "planner:backups";
const SAVE_DELAY_MS = 1200;

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

/** Plan lu DIRECTEMENT dans le localStorage, jamais dans l'atome (cf. ci-dessous). */
function readLocalPlan(): PlannerState {
  try {
    return readPlannerState(JSON.parse(read(PLANNER_STORAGE_KEY) ?? "null"));
  } catch {
    return readPlannerState(null);
  }
}

function backupLocal(plan: PlannerState) {
  if (isEmptyPlan(plan)) return;
  let backups: unknown[] = [];
  try {
    const parsed = JSON.parse(read(BACKUP_KEY) ?? "[]");
    if (Array.isArray(parsed)) backups = parsed.slice(-2);
  } catch {}
  backups.push({ at: new Date().toISOString(), plan });
  write(BACKUP_KEY, JSON.stringify(backups));
}

/**
 * Synchronise le plan avec le compte connecté, sur le modèle de la
 * progression de la carte (`useProgressSync`) :
 *
 * - premier chargement de ce compte sur cet appareil, changements locaux non
 *   envoyés, ou plan du compte vide : **fusion** des deux plans, rien n'est
 *   perdu ;
 * - sinon le compte fait foi, après une copie de secours du plan local ;
 * - ensuite chaque changement part au serveur après un court délai.
 *
 * Le plan local est lu dans le localStorage et pas dans l'atome : fusionner
 * avec une valeur initiale vide a déjà effacé la progression d'un joueur sur
 * la carte (25/09/2026).
 */
export function usePlannerSync(): PlannerSyncStatus {
  const { data: session, status: authStatus } = useSession();
  const userId = session?.user?.id ?? null;
  const [plan, setPlan] = useAtom(plannerStateAtom);
  const [status, setStatus] = useState<PlannerSyncStatus>("anonymous");
  const hydratedFor = useRef<string | null>(null);
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId || hydratedFor.current === userId) return;
    let cancelled = false;
    fetch("/api/planner", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((server: { plan: unknown; unavailable?: boolean }) => {
        if (cancelled) return;
        if (server.unavailable) {
          setStatus("unavailable");
          return;
        }
        const local = readLocalPlan();
        const remote = server.plan ? readPlannerState(server.plan) : null;
        const merge = !remote || isEmptyPlan(remote) || read(SYNCED_USER_KEY) !== userId || read(DIRTY_KEY) === "1";
        let next: PlannerState;
        if (!remote) next = local;
        else if (merge) next = mergePlans(remote, local);
        else {
          backupLocal(local);
          next = remote;
        }
        // Pas de renvoi immédiat si l'état vient tel quel du serveur.
        skipNextSave.current = !merge;
        setPlan(next);
        write(SYNCED_USER_KEY, userId);
        if (merge) write(DIRTY_KEY, "1");
        hydratedFor.current = userId;
        setStatus("synced");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, setPlan]);

  useEffect(() => {
    if (!userId || hydratedFor.current !== userId) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    write(DIRTY_KEY, "1");
    const timer = setTimeout(() => {
      setStatus("saving");
      fetch("/api/planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      })
        .then((r) => {
          if (r.status === 503) {
            setStatus("unavailable");
            return;
          }
          if (!r.ok) throw new Error(String(r.status));
          write(DIRTY_KEY, null);
          setStatus("synced");
        })
        .catch(() => setStatus("error"));
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [plan, userId]);

  if (authStatus !== "authenticated") return "anonymous";
  if (status === "anonymous") return "loading";
  return status;
}
