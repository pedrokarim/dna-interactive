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

// La rotation change au top de l'heure. On vérifie /latest en continu (filet de
// sécurité → MAJ sans rechargement quoi qu'il arrive) et on accélère juste après
// le passage du compte à rebours à 0, le temps que la collecte tourne (~HH:01).
const STEADY_POLL_MS = 60_000;
const BURST_DELAY_MS = 25_000;
const BURST_INTERVAL_MS = 20_000;
const BURST_MAX = 18;

const subscribeMounted = () => () => {};

/** La rotation porte-t-elle au moins un objectif ? (Le serveur vide une rotation périmée.) */
function hasRotationData(state: RotationState): boolean {
  return REGIONS.some((region) => CATEGORIES.some((category) => (state.regions[region]?.[category]?.length ?? 0) > 0));
}

/**
 * Rotation affichée, tenue à jour sans rechargement : état de fraîcheur
 * recalculé chaque seconde sur l'horloge du visiteur, vérifications de
 * `/api/commissions/latest` en continu, puis rapprochées au changement d'heure.
 * Partagé par la page `/commissions` et la section de l'accueil.
 */
export function useLiveRotation(initialState: RotationState, initialMeta: RotationMeta) {
  const locale = useLocale();
  const [state, setState] = useState(initialState);
  const [meta, setMeta] = useState(initialMeta);
  const [syncing, setSyncing] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // État de la rotation recalculé avec l'horloge du visiteur : à l'heure pleine,
  // la rotation affichée devient fausse et doit disparaître sans attendre le
  // prochain appel à l'API. Avant montage, l'état calculé par le serveur.
  const [freshness, setFreshness] = useState<RotationFreshness>(initialMeta.freshness);
  useEffect(() => {
    const update = () => setFreshness(rotationFreshness(meta.updatedAt));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [meta.updatedAt]);
  const live = freshness === "live" && hasRotationData(state);

  // Heures formatées dans le FUSEAU LOCAL du visiteur (toLocaleTimeString par
  // défaut), avec l'abréviation de fuseau. Seulement après hydratation : le
  // fuseau diffère entre le serveur et le navigateur.
  const hydrated = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZoneName: "short" };
  const nextLabel = hydrated ? new Date(meta.nextRefreshAt).toLocaleTimeString(toIntlLocale(locale), opts) : null;
  // La date n'est utile que si la dernière collecte n'est pas d'aujourd'hui :
  // en panne depuis des jours, l'heure seule ne dit rien.
  const updated = hydrated && meta.updatedAt ? new Date(meta.updatedAt) : null;
  const updatedLabel = updated
    ? updated.toDateString() === new Date().toDateString()
      ? updated.toLocaleTimeString(toIntlLocale(locale), opts)
      : updated.toLocaleString(toIntlLocale(locale), { ...opts, day: "numeric", month: "long" })
    : null;

  // Dernier hash connu, accessible aux pollers sans les recréer à chaque MAJ.
  const latestHashRef = useRef(state.contentHash);
  useEffect(() => {
    latestHashRef.current = state.contentHash;
  }, [state.contentHash]);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  // Récupère l'état courant et remplace la rotation affichée si le contenu a
  // changé. Cache-buster `?t=` pour court-circuiter tout cache intermédiaire.
  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/commissions/latest?t=${Date.now()}`, { cache: "no-store" });
      const data = (await res.json()) as { state?: RotationState; meta?: RotationMeta };
      if (data.meta) setMeta(data.meta);
      // Une rotation qui redevient valable (collecte reprise) arrive avec un
      // nouveau hash ; une rotation devenue périmée garde le sien mais sans
      // objectifs, et c'est `freshness` qui la masque.
      if (data.state?.contentHash && data.state.contentHash !== latestHashRef.current) {
        setState(data.state);
        setSyncing(false);
        return true;
      }
    } catch {
      // réseau indisponible : on réessaiera au prochain tick
    }
    return false;
  }, []);

  // Filet de sécurité : vérification périodique → la page se met à jour seule.
  useEffect(() => {
    const id = setInterval(() => void checkForUpdate(), STEADY_POLL_MS);
    return () => clearInterval(id);
  }, [checkForUpdate]);

  // Au passage du compte à rebours à 0 : vérifications rapprochées le temps que
  // la nouvelle rotation soit collectée.
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

  // La rotation affichée vient d'expirer : vérifications rapprochées, même si
  // le compte à rebours, masqué avec elle, n'a pas eu le temps de les lancer.
  useEffect(() => {
    if (freshness !== "syncing") return;
    const id = setTimeout(handleComplete, 0);
    return () => clearTimeout(id);
  }, [freshness, handleComplete]);

  return { state, meta, freshness, live, syncing, nextLabel, updatedLabel, handleComplete };
}
