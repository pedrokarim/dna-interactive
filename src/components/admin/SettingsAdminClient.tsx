"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { DnaButton, DnaPanel, DnaSectionLabel, cn } from "@/components/dna";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings";
import { AuthConfigPanel } from "./AuthConfigPanel";

const inputClass =
  "w-full rounded-sm border border-white/10 bg-ink/60 px-3 py-2 text-sm text-parch outline-none transition-colors placeholder:text-muted-2 focus:border-gold/50";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
      <span className="min-w-0">
        <span className="block font-sans text-sm text-parch">{label}</span>
        {description ? <span className="mt-0.5 block font-sans text-xs text-muted">{description}</span> : null}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors",
          checked ? "border-gold bg-gold/30" : "border-white/15 bg-ink/60",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all",
            checked ? "left-[1.15rem] bg-gold-bright" : "left-0.5 bg-white/40",
          )}
        />
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsAdminClient() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <DnaPanel className="p-5"><p className="font-sans text-sm text-muted">Chargement…</p></DnaPanel>;
  }

  const s = settings;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Annonce */}
        <DnaPanel className="p-5">
          <DnaSectionLabel>Bannière d'annonce</DnaSectionLabel>
          <div className="mt-3 divide-y divide-white/10">
            <Toggle checked={s.announcementEnabled} onChange={(v) => set("announcementEnabled", v)} label="Afficher la bannière" description="Message affiché à tous les visiteurs, en haut du site." />
          </div>
          <div className="mt-3 space-y-3">
            <input className={inputClass} value={s.announcementText} onChange={(e) => set("announcementText", e.target.value)} placeholder="Texte de l'annonce" />
            <input className={inputClass} value={s.announcementLink} onChange={(e) => set("announcementLink", e.target.value)} placeholder="Lien (optionnel) — /page ou https://…" />
          </div>
        </DnaPanel>

        {/* Maintenance */}
        <DnaPanel className="p-5">
          <DnaSectionLabel>Maintenance</DnaSectionLabel>
          <div className="mt-3 divide-y divide-white/10">
            <Toggle checked={s.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} label="Mode maintenance" description="Bandeau d'alerte + blocage des créations (compte, build)." />
          </div>
          <div className="mt-3">
            <input className={inputClass} value={s.maintenanceMessage} onChange={(e) => set("maintenanceMessage", e.target.value)} placeholder="Message de maintenance" />
          </div>
        </DnaPanel>

        {/* Fonctionnalités */}
        <DnaPanel className="p-5">
          <DnaSectionLabel>Fonctionnalités</DnaSectionLabel>
          <div className="mt-2 divide-y divide-white/10">
            <Toggle checked={s.signupEnabled} onChange={(v) => set("signupEnabled", v)} label="Création de compte" description="Autoriser les nouvelles inscriptions." />
            <Toggle checked={s.buildCreationEnabled} onChange={(v) => set("buildCreationEnabled", v)} label="Publication de builds" description="Autoriser la création de nouveaux builds." />
            <Toggle checked={s.commissionsVisible} onChange={(v) => set("commissionsVisible", v)} label="Afficher les commissions" description="Sur l'accueil, la page et la sidebar." />
            <Toggle checked={s.googleAuthEnabled} onChange={(v) => set("googleAuthEnabled", v)} label="Connexion Google" description="Proposer Google en plus de Discord (selon config env)." />
          </div>
        </DnaPanel>

        {/* Calendrier */}
        <DnaPanel className="p-5">
          <DnaSectionLabel>Calendrier</DnaSectionLabel>
          <div className="mt-3">
            <label className="mb-1 block font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted">Date de référence (« aujourd'hui »)</label>
            <input type="date" className={inputClass} value={s.calendarToday} onChange={(e) => set("calendarToday", e.target.value)} />
            <p className="mt-1.5 font-sans text-xs text-muted">Vide = date par défaut du code. À caler sur le patch courant.</p>
          </div>
        </DnaPanel>
      </div>

      <AuthConfigPanel />

      {error ? <p className="font-sans text-sm text-[#ffb3a6]">{error}</p> : null}

      <div className="flex items-center gap-3">
        <DnaButton variant="gold" onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer les réglages"}
        </DnaButton>
        {saved ? (
          <span className="inline-flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.14em] text-anemo">
            <Check className="h-3.5 w-3.5" />
            Enregistré
          </span>
        ) : null}
      </div>
    </div>
  );
}
