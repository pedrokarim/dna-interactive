"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/components/dna";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings";
import { AuthConfigPanel } from "./AuthConfigPanel";
import { FIELD_WIDTH, AdminFormButton, AdminPanel, AdminTableSkeleton, adminInputClass, adminLabelClass } from "./ui";

/**
 * Réglages applicatifs.
 *
 * Un écran de configuration n'a pas de tableau : ce sont des interrupteurs et
 * des champs. Ce qui compte ici, c'est qu'on voie immédiatement qu'une
 * modification n'est **pas encore enregistrée** – d'où la barre collante en
 * bas, qui n'apparaît qu'en cas de changement en attente.
 */
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 px-3 py-2.5">
      <span className="min-w-0">
        <span className="block font-sans text-[0.84rem] text-parch">{label}</span>
        {description ? <span className="mt-0.5 block font-sans text-[0.72rem] text-muted">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 border transition-colors",
          checked ? "border-gold bg-gold/30" : "border-white/15 bg-black/40",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-3 w-3 transition-all",
            checked ? "left-[1.2rem] bg-gold-bright" : "left-[3px] bg-white/40",
          )}
        />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export function SettingsAdminClient() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (alive) setSettings(json?.settings ?? DEFAULT_SETTINGS);
      })
      .catch(() => {
        if (alive) setSettings(DEFAULT_SETTINGS);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSaved(false);
    setDirty(true);
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Échec de l'enregistrement.");
        return;
      }
      if (json.settings) setSettings(json.settings);
      setSaved(true);
      setDirty(false);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <AdminPanel label="Configuration">
        <AdminTableSkeleton rows={5} columns={2} />
      </AdminPanel>
    );
  }

  const s = settings;

  return (
    <div className="flex flex-col gap-4 pb-16">
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <AdminPanel label="Bannière d'annonce">
          <div className="divide-y divide-white/[0.06]">
            <Toggle
              checked={s.announcementEnabled}
              onChange={(v) => set("announcementEnabled", v)}
              label="Afficher la bannière"
              description="Message affiché à tous les visiteurs, en haut du site."
            />
          </div>
          <div className="flex flex-col gap-2 border-t border-white/[0.06] p-3">
            <div>
              <label className={adminLabelClass} htmlFor="set-announcement-text">
                Texte
              </label>
              <input
                id="set-announcement-text"
                className={cn(adminInputClass, FIELD_WIDTH.medium)}
                value={s.announcementText}
                onChange={(e) => set("announcementText", e.target.value)}
                placeholder="Texte de l'annonce"
              />
            </div>
            <div>
              <label className={adminLabelClass} htmlFor="set-announcement-link">
                Lien (facultatif)
              </label>
              <input
                id="set-announcement-link"
                className={cn(adminInputClass, FIELD_WIDTH.long)}
                value={s.announcementLink}
                onChange={(e) => set("announcementLink", e.target.value)}
                placeholder="/page ou https://…"
              />
            </div>
          </div>
        </AdminPanel>

        <AdminPanel label="Maintenance">
          <div className="divide-y divide-white/[0.06]">
            <Toggle
              checked={s.maintenanceMode}
              onChange={(v) => set("maintenanceMode", v)}
              label="Mode maintenance"
              description="Bandeau d'alerte et blocage des créations (compte, build)."
            />
          </div>
          <div className="border-t border-white/[0.06] p-3">
            <label className={adminLabelClass} htmlFor="set-maintenance-message">
              Message
            </label>
            <input
              id="set-maintenance-message"
              className={cn(adminInputClass, FIELD_WIDTH.medium)}
              value={s.maintenanceMessage}
              onChange={(e) => set("maintenanceMessage", e.target.value)}
              placeholder="Message de maintenance"
            />
          </div>
        </AdminPanel>

        <AdminPanel label="Fonctionnalités">
          <div className="divide-y divide-white/[0.06]">
            <Toggle
              checked={s.signupEnabled}
              onChange={(v) => set("signupEnabled", v)}
              label="Création de compte"
              description="Autoriser les nouvelles inscriptions."
            />
            <Toggle
              checked={s.buildCreationEnabled}
              onChange={(v) => set("buildCreationEnabled", v)}
              label="Publication de builds"
              description="Autoriser la création de nouveaux builds."
            />
            <Toggle
              checked={s.commissionsVisible}
              onChange={(v) => set("commissionsVisible", v)}
              label="Afficher les commissions"
              description="Sur l'accueil, la page dédiée et la barre latérale."
            />
            <Toggle
              checked={s.googleAuthEnabled}
              onChange={(v) => set("googleAuthEnabled", v)}
              label="Connexion Google"
              description="Proposer Google en plus de Discord, selon la configuration serveur."
            />
          </div>
        </AdminPanel>

        <AdminPanel label="Calendrier">
          <div className="p-3">
            <label className={adminLabelClass} htmlFor="set-calendar-today">
              Forcer la date de référence
            </label>
            <input
              id="set-calendar-today"
              type="date"
              className={cn(adminInputClass, FIELD_WIDTH.date)}
              value={s.calendarToday}
              onChange={(e) => set("calendarToday", e.target.value)}
            />
            <p className="mt-2 font-sans text-[0.72rem] text-muted">
              Vide : le curseur suit l&apos;horloge de chaque visiteur. Une valeur ici fige la frise{" "}
              <strong className="font-normal text-[#ffb3a6]">pour tout le monde</strong> – à réserver aux tests et aux
              captures.
            </p>
          </div>
        </AdminPanel>
      </div>

      <AuthConfigPanel />

      {/* Barre d'enregistrement : n'apparaît qu'en cas de modification en attente. */}
      {dirty || error || saved ? (
        <div className="sticky bottom-0 z-20 -mx-4 flex items-center gap-3 border-t border-white/10 bg-[#07090d]/95 px-4 py-2.5 backdrop-blur-md md:-mx-5 md:px-5">
          {error ? (
            <span className="font-sans text-[0.78rem] text-[#ffb3a6]">{error}</span>
          ) : saved ? (
            <span className="inline-flex items-center gap-1.5 font-sans text-[0.78rem] text-gold">
              <Check className="h-3.5 w-3.5" />
              Réglages enregistrés.
            </span>
          ) : (
            <span className="font-sans text-[0.78rem] text-muted">Modifications non enregistrées.</span>
          )}
          <span className="ml-auto flex items-center gap-2">
            <AdminFormButton variant="primary" onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </AdminFormButton>
          </span>
        </div>
      ) : null}
    </div>
  );
}
