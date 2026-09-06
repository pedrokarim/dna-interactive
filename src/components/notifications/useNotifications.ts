"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { AppNotification, NotificationFeed } from "@/lib/notifications/types";

const STORAGE_KEY = "dna:notif-read";
/** Ancienne clé : un simple horodatage « tout vu jusqu'à ». Lue, jamais réécrite. */
const LEGACY_KEY = "dna:notif-last-seen";
const REFRESH_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Dépôt partagé
//
// Un seul état pour toute l'application : la cloche et la page dédiée lisent la
// même source et ne déclenchent qu'un appel réseau. On passe par
// `useSyncExternalStore` plutôt que par des `useState` synchronisés dans des
// effets – c'est ce que le store est fait pour, et ça évite les rendus en
// cascade au montage.
// ---------------------------------------------------------------------------

type Snapshot = {
  items: AppNotification[];
  unread: number;
  persisted: boolean;
  loading: boolean;
};

const EMPTY_SNAPSHOT: Snapshot = { items: [], unread: 0, persisted: false, loading: true };

let feed: NotificationFeed | null = null;
let localRead: Set<string> | null = null;
let legacyThreshold = 0;
/** Recalculé uniquement quand l'état change : la référence doit rester stable. */
let snapshot: Snapshot = EMPTY_SNAPSHOT;
let inflight: Promise<void> | null = null;

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snapshot {
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return EMPTY_SNAPSHOT;
}

function recompute() {
  const read = localRead ?? new Set<string>();
  const items = (feed?.notifications ?? []).map((n) => ({
    ...n,
    // Lu côté serveur OU côté navigateur : les deux dépôts font foi ensemble,
    // pour qu'une connexion tardive ne rende pas d'un coup tout le fil non lu.
    read:
      Boolean(n.read) ||
      read.has(n.id) ||
      (legacyThreshold > 0 && Date.parse(n.createdAt) <= legacyThreshold),
  }));
  snapshot = {
    items,
    unread: items.filter((n) => !n.read).length,
    persisted: feed?.persisted ?? false,
    loading: feed === null,
  };
  for (const listener of listeners) listener();
}

// -- État de lecture local (visiteurs anonymes, et repli hors ligne) ---------

function ensureLocalLoaded() {
  if (localRead !== null) return;
  localRead = new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (Array.isArray(parsed)) {
      for (const value of parsed) if (typeof value === "string") localRead.add(value);
    }
    legacyThreshold = Number(localStorage.getItem(LEGACY_KEY)) || 0;
  } catch {
    /* stockage indisponible (navigation privée) : on dégrade sans casser */
  }
}

function persistLocal() {
  try {
    // On borne le stockage : au-delà, ce sont des notifications qui ne
    // reviendront jamais dans le fil, donc leur état de lecture ne sert plus.
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...(localRead ?? [])].slice(-300)));
  } catch {
    /* idem */
  }
}

function fetchFeed(force = false): Promise<void> {
  if (inflight && !force) return inflight;
  inflight = fetch("/api/notifications")
    .then((response) => (response.ok ? (response.json() as Promise<NotificationFeed>) : null))
    .then((json) => {
      if (json) {
        feed = json;
        recompute();
      }
    })
    .catch(() => {})
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function markRead(ids: string[]) {
  if (ids.length === 0) return;
  ensureLocalLoaded();
  for (const id of ids) localRead!.add(id);
  persistLocal();
  recompute();
  // Au mieux : hors connexion la route répond 204 et le local fait foi.
  void fetch("/api/notifications/read", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: ids.slice(0, 100) }),
  }).catch(() => {});
}

/**
 * Fil de notifications côté client.
 *
 * L'état « lu » a deux dépôts, et c'est voulu : la base pour les comptes
 * connectés (il suit alors l'utilisateur d'un appareil à l'autre), le stockage
 * local pour tout le monde, y compris les visiteurs anonymes – qui sont
 * l'essentiel du trafic d'un site de ce type.
 */
export function useNotifications(): Snapshot & {
  refresh: () => void;
  markRead: (ids: string[]) => void;
  markAllRead: () => void;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Première lecture du stockage local + premier appel réseau. Les deux
    // passent par `recompute()`, jamais par un setState direct.
    ensureLocalLoaded();
    recompute();
    void fetchFeed();
  }, []);

  // Rafraîchissement discret : au retour sur l'onglet, et lentement en fond.
  // Pas de long-polling ni de websocket – une annonce n'est pas une urgence.
  useEffect(() => {
    const onFocus = () => void fetchFeed(true);
    const timer = window.setInterval(() => void fetchFeed(true), REFRESH_MS);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const markAllRead = useCallback(() => {
    markRead((feed?.notifications ?? []).map((n) => n.id));
  }, []);

  return {
    ...state,
    refresh: () => void fetchFeed(true),
    markRead,
    markAllRead,
  };
}
