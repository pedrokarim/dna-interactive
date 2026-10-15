"use client";

import { toIntlLocale } from "@/lib/intl-locale";
import { AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DnaPanel } from "@/components/dna/Panel";
import { cn } from "@/components/dna";
import { rotationFreshness } from "@/lib/commissions/meta";
import {
  CATEGORIES,
  REGIONS,
  type RotationFreshness,
  type RotationMeta,
  type RotationState,
} from "@/lib/commissions/types";
import { CountdownTimer } from "./CountdownTimer";
import { RegionCard } from "./RegionCard";

// La rotation change au top de l'heure. On vérifie /latest en continu (filet de
// sécurité → MAJ sans rechargement quoi qu'il arrive) et on accélère juste après
// le passage du compte à rebours à 0, le temps que la collecte tourne (~HH:01).
const STEADY_POLL_MS = 60_000;
const BURST_DELAY_MS = 25_000;
const BURST_INTERVAL_MS = 20_000;
const BURST_MAX = 18;

/** La rotation porte-t-elle au moins un objectif ? (Le serveur vide une rotation périmée.) */
function hasRotationData(state: RotationState): boolean {
  return REGIONS.some((region) => CATEGORIES.some((category) => (state.regions[region]?.[category]?.length ?? 0) > 0));
}

const FRESHNESS_TONE: Record<RotationFreshness, { dot: string; text: string }> = {
  live: { dot: "bg-anemo", text: "text-anemo" },
  syncing: { dot: "bg-gold-bright animate-pulse", text: "text-gold-bright" },
  stale: { dot: "bg-crimson-bright", text: "text-crimson-bright" },
  none: { dot: "bg-crimson-bright", text: "text-crimson-bright" },
};

/** Pastille d'état : à jour, récupération en cours, collecte interrompue. */
function FreshnessBadge({ freshness }: { freshness: RotationFreshness }) {
  const t = useTranslations("commissions");
  const tone = FRESHNESS_TONE[freshness];
  return (
    <p className={cn("flex items-center gap-2 font-caps text-[0.62rem] uppercase tracking-[0.24em]", tone.text)} role="status">
      <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", tone.dot)} />
      {t(`status.${freshness}`)}
    </p>
  );
}

/** Remplace la grille quand aucune rotation ne couvre l'heure en cours. */
function NoCurrentRotation({ freshness, lastCollected }: { freshness: RotationFreshness; lastCollected: string | null }) {
  const t = useTranslations("commissions");
  const syncing = freshness === "syncing";
  return (
    <DnaPanel
      inner
      className={cn(
        "flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center",
        syncing ? "border-gold/30" : "border-crimson-bright/40",
      )}
    >
      {syncing ? (
        <Loader2 className="h-6 w-6 animate-spin text-gold" aria-hidden />
      ) : (
        <AlertTriangle className="h-6 w-6 text-crimson-bright" aria-hidden />
      )}
      <p className="font-display text-2xl text-parch">{t(`empty.${freshness}.title`)}</p>
      <p className="max-w-xl text-sm text-parch/75">
        {t(`empty.${freshness}.body`, { time: lastCollected ?? "–" })}
      </p>
    </DnaPanel>
  );
}

export function CommissionsBoard({
  initialState,
  initialMeta,
}: {
  initialState: RotationState;
  initialMeta: RotationMeta;
}) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  const [state, setState] = useState(initialState);
  const [meta, setMeta] = useState(initialMeta);
  const [syncing, setSyncing] = useState(false);
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);
  const [nextLabel, setNextLabel] = useState<string | null>(null);
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
  // défaut), avec l'abréviation de fuseau. Calculé après montage pour éviter le
  // mismatch d'hydratation (le fuseau diffère serveur/client).
  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };
    setNextLabel(new Date(meta.nextRefreshAt).toLocaleTimeString(toIntlLocale(locale), opts));
    // La date n'est utile que si la dernière collecte n'est pas d'aujourd'hui :
    // en panne depuis des jours, l'heure seule ne dit rien.
    const updated = meta.updatedAt ? new Date(meta.updatedAt) : null;
    const sameDay = updated ? updated.toDateString() === new Date().toDateString() : true;
    setUpdatedLabel(
      updated
        ? sameDay
          ? updated.toLocaleTimeString(toIntlLocale(locale), opts)
          : updated.toLocaleString(toIntlLocale(locale), { ...opts, day: "numeric", month: "long" })
        : null,
    );
  }, [meta.nextRefreshAt, meta.updatedAt, locale]);

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

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 text-center">
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-parch/80">{t("description")}</p>
      </header>

      {/* Bandeau : état de la collecte, puis compte à rebours */}
      <DnaPanel inner className="mb-8 p-5 sm:p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center border border-gold/30 bg-gold/10 text-gold">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <FreshnessBadge freshness={freshness} />
              {live && nextLabel ? (
                <p className="mt-1 text-[0.8rem] text-parch/80">
                  {t("nextRefresh")} {t("nextAt", { time: nextLabel })}
                </p>
              ) : null}
              {updatedLabel ? (
                <p className="mt-0.5 text-[0.72rem] text-parch/55">{t("lastCollected", { time: updatedLabel })}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncing && live ? (
              <span className="flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("syncing")}
              </span>
            ) : null}
            {/* Le décompte n'a de sens que pour une rotation valable : sans elle,
                il ferait croire que les données affichées courent jusqu'à zéro.
                Le passage à zéro déclenche les vérifications rapprochées, qui
                continuent ensuite sans lui. */}
            {live ? (
              <CountdownTimer
                target={meta.nextRefreshAt}
                onComplete={handleComplete}
                className="font-display text-4xl tabular-nums text-gold-bright sm:text-5xl"
              />
            ) : null}
          </div>
        </div>
      </DnaPanel>

      {live ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {REGIONS.map((region) => (
            <RegionCard key={region} region={region} data={state.regions[region]} locale={locale} />
          ))}
        </div>
      ) : (
        <NoCurrentRotation freshness={freshness === "live" ? "none" : freshness} lastCollected={updatedLabel} />
      )}

      <p className="mt-8 text-center text-[0.72rem] text-parch/45">{t("utcNote")}</p>
    </div>
  );
}
