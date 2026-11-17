"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { toIntlLocale } from "@/lib/intl-locale";
import { rotationFreshness } from "@/lib/commissions/meta";
import {
  CATEGORIES,
  REGIONS,
  type RotationFreshness,
  type RotationMeta,
  type RotationState,
} from "@/lib/commissions/types";

// La rotation change à l'heure pleine. On interroge /latest toutes les minutes
// quoi qu'il arrive, et plus souvent juste après la fin du compte à rebours, le
// temps que la collecte tourne (vers HH:01).
const STEADY_POLL_MS = 60_000;
const BURST_DELAY_MS = 25_000;
const BURST_INTERVAL_MS = 20_000;
const BURST_MAX = 18;

const subscribeMounted = () => () => {};

/** Au moins un objectif dans la rotation ? Le serveur vide une rotation périmée. */
function hasRotationData(state: RotationState): boolean {
  return REGIONS.some((region) => CATEGORIES.some((category) => (state.regions[region]?.[category]?.length ?? 0) > 0));
}

/**
 * Rotation affichée, mise à jour sans rechargement. La fraîcheur est recalculée
 * chaque seconde sur l'horloge du visiteur, et `/api/commissions/latest` est
 * interrogé en continu, plus souvent au changement d'heure.
 * Sert à la page `/commissions` et à la section de l'accueil.
 */
export function useLiveRotation(initialState: RotationState, initialMeta: RotationMeta) {
  const locale = useLocale();
  const [state, setState] = useState(initialState);
  const [meta, setMeta] = useState(initialMeta);
  const [syncing, setSyncing] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculé sur l'horloge du visiteur : à l'heure pleine, la rotation affichée
  // est fausse et doit disparaître sans attendre l'appel suivant à l'API.
  // Avant montage, on garde l'état calculé par le serveur.
  const [freshness, setFreshness] = useState<RotationFreshness>(initialMeta.freshness);
  useEffect(() => {
    const update = () => setFreshness(rotationFreshness(meta.updatedAt));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [meta.updatedAt]);
  const live = freshness === "live" && hasRotationData(state);

  // Heures dans le fuseau du visiteur, avec son abréviation. Seulement après
  // hydratation, le serveur n'a pas le même fuseau que le navigateur.
  const hydrated = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZoneName: "short" };
  const nextLabel = hydrated ? new Date(meta.nextRefreshAt).toLocaleTimeString(toIntlLocale(locale), opts) : null;
  // On ajoute la date si la dernière collecte n'est pas d'aujourd'hui : après
  // des jours de panne, l'heure seule ne veut rien dire.
  const updated = hydrated && meta.updatedAt ? new Date(meta.updatedAt) : null;
  const updatedLabel = updated
    ? updated.toDateString() === new Date().toDateString()
      ? updated.toLocaleTimeString(toIntlLocale(locale), opts)
      : updated.toLocaleString(toIntlLocale(locale), { ...opts, day: "numeric", month: "long" })
    : null;

  // Dernier hash connu, dans une ref pour ne pas recréer les pollers à chaque mise à jour.
  const latestHashRef = useRef(state.contentHash);
  useEffect(() => {
    latestHashRef.current = state.contentHash;
  }, [state.contentHash]);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  // Remplace la rotation affichée si le contenu a changé. Le `?t=` contourne
  // les caches intermédiaires.
  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/commissions/latest?t=${Date.now()}`, { cache: "no-store" });
      const data = (await res.json()) as { state?: RotationState; meta?: RotationMeta };
      if (data.meta) setMeta(data.meta);
      // Collecte reprise : la rotation arrive avec un nouveau hash. Rotation
      // périmée : même hash mais sans objectifs, c'est `freshness` qui la masque.
      if (data.state?.contentHash && data.state.contentHash !== latestHashRef.current) {
        setState(data.state);
        setSyncing(false);
        return true;
      }
    } catch {
      // Réseau indisponible : on réessaiera au prochain tick.
    }
    return false;
  }, []);

  // Vérification toutes les minutes, au cas où le reste raterait le changement.
  useEffect(() => {
    const id = setInterval(() => void checkForUpdate(), STEADY_POLL_MS);
    return () => clearInterval(id);
  }, [checkForUpdate]);

  // Compte à rebours à 0 : on vérifie plus souvent le temps que la nouvelle
  // rotation soit collectée.
  const handleComplete = useCallback(() => {
    // Un seul cycle à la fois : le compte à rebours et le passage en `syncing`
    // peuvent le lancer dans la même seconde.
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setSyncing(true);
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const updated = await checkForUpdate();
      if (updated || attempts >= BURST_MAX) {
        setSyncing(false);
        return;
      }
      pollTimer.current = setTimeout(tick, BURST_INTERVAL_MS);
    };
    pollTimer.current = setTimeout(tick, BURST_DELAY_MS);
  }, [checkForUpdate]);

  // La rotation affichée vient d'expirer : on lance les vérifications nous-mêmes,
  // le compte à rebours a pu être masqué avec elle avant de le faire.
  useEffect(() => {
    if (freshness !== "syncing") return;
    const id = setTimeout(handleComplete, 0);
    return () => clearTimeout(id);
  }, [freshness, handleComplete]);

  return { state, meta, freshness, live, syncing, nextLabel, updatedLabel, handleComplete };
}
