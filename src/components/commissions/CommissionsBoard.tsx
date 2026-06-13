"use client";

import { Clock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DnaPanel } from "@/components/dna/Panel";
import { REGIONS, type RotationMeta, type RotationState } from "@/lib/commissions/types";
import { CountdownTimer } from "./CountdownTimer";
import { RegionCard } from "./RegionCard";

// La rotation change au top de l'heure. On vérifie /latest en continu (filet de
// sécurité → MAJ sans rechargement quoi qu'il arrive) et on accélère juste après
// le passage du compte à rebours à 0, le temps que la collecte tourne (~HH:01).
const STEADY_POLL_MS = 60_000;
const BURST_DELAY_MS = 25_000;
const BURST_INTERVAL_MS = 20_000;
const BURST_MAX = 18;

export function CommissionsBoard({
  initialState,
  initialMeta,
  hasData,
}: {
  initialState: RotationState;
  initialMeta: RotationMeta;
  hasData: boolean;
}) {
  const t = useTranslations("commissions");
  const locale = useLocale();
  const [state, setState] = useState(initialState);
  const [meta, setMeta] = useState(initialMeta);
  const [syncing, setSyncing] = useState(false);
  const [updatedLabel, setUpdatedLabel] = useState<string | null>(null);
  const [nextLabel, setNextLabel] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Heures formatées dans le FUSEAU LOCAL du visiteur (toLocaleTimeString par
  // défaut), avec l'abréviation de fuseau. Calculé après montage pour éviter le
  // mismatch d'hydratation (le fuseau diffère serveur/client).
  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };
    setNextLabel(new Date(meta.nextRefreshAt).toLocaleTimeString(locale, opts));
    setUpdatedLabel(
      meta.updatedAt ? new Date(meta.updatedAt).toLocaleTimeString(locale, opts) : null,
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

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 text-center">
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">
          {t("eyebrow")}
        </p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-parch/80">{t("description")}</p>
      </header>

      {/* Bandeau countdown */}
      <DnaPanel inner className="mb-8 p-5 sm:p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center border border-gold/30 bg-gold/10 text-gold">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="font-caps text-[0.62rem] uppercase tracking-[0.28em] text-gold/80">
                {t("nextRefresh")}
              </p>
              {nextLabel ? (
                <p className="mt-0.5 text-[0.8rem] text-parch/80">{t("nextAt", { time: nextLabel })}</p>
              ) : null}
              {updatedLabel ? (
                <p className="mt-0.5 text-[0.72rem] text-parch/45">
                  {t("lastUpdated", { time: updatedLabel })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {syncing ? (
              <span className="flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.18em] text-gold/70">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("syncing")}
              </span>
            ) : null}
            <CountdownTimer
              target={meta.nextRefreshAt}
              onComplete={handleComplete}
              className="font-display text-4xl tabular-nums text-gold-bright sm:text-5xl"
            />
          </div>
        </div>
      </DnaPanel>

      {!hasData ? (
        <p className="mb-6 border border-gold/20 bg-gold/5 px-4 py-2 text-center text-[0.78rem] text-gold/80">
          {t("fallbackNotice")}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {REGIONS.map((region) => (
          <RegionCard key={region} region={region} data={state.regions[region]} locale={locale} />
        ))}
      </div>

      <p className="mt-8 text-center text-[0.72rem] text-parch/45">{t("utcNote")}</p>
    </div>
  );
}
