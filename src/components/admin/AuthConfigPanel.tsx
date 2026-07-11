"use client";

import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { DnaButton, DnaPanel, DnaSectionLabel, cn } from "@/components/dna";

type AuthConfigView = {
  discordId: string;
  googleId: string;
  hasDiscordSecret: boolean;
  hasGoogleSecret: boolean;
  envDiscord: boolean;
  envGoogle: boolean;
};

const inputClass =
  "w-full rounded-sm border border-white/10 bg-ink/60 px-3 py-2 text-sm text-parch outline-none transition-colors placeholder:text-muted-2 focus:border-gold/50";
const labelClass = "mb-1 block font-caps text-[0.55rem] uppercase tracking-[0.16em] text-muted";

export function AuthConfigPanel() {
  const [view, setView] = useState<AuthConfigView | null>(null);
  const [discordId, setDiscordId] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [discordSecret, setDiscordSecret] = useState("");
  const [googleSecret, setGoogleSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin/auth-config");
    if (!res.ok) return;
    const json = await res.json();
    const cfg = json.config as AuthConfigView;
    setView(cfg);
    setDiscordId(cfg.discordId);
    setGoogleId(cfg.googleId);
    setDiscordSecret("");
    setGoogleSecret("");
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, googleId, discordSecret, googleSecret }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Échec de l'enregistrement.");
        return;
      }
      if (json.config) {
        setView(json.config);
        setDiscordSecret("");
        setGoogleSecret("");
      }
      setSaved(true);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const secretPlaceholder = (has: boolean, env: boolean) =>
    has ? "•••••••••• (défini — laisser vide pour conserver)" : env ? "(hérité de l'env — saisir pour surcharger)" : "Client Secret";

  return (
    <DnaPanel className="p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-gold" />
        <DnaSectionLabel>Authentification (OAuth)</DnaSectionLabel>
      </div>
      <p className="mt-2 font-sans text-xs text-muted">
        Surcharge les variables d'environnement. Vide = valeur de l'env conservée. Les secrets sont
        <strong className="text-parch/85"> chiffrés</strong> et jamais renvoyés au navigateur.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Discord — Client ID {view?.envDiscord ? <span className="text-anemo">· env ✓</span> : null}</label>
          <input className={inputClass} value={discordId} onChange={(e) => { setDiscordId(e.target.value); setSaved(false); }} placeholder="AUTH_DISCORD_ID" />
        </div>
        <div>
          <label className={labelClass}>Discord — Client Secret {view?.hasDiscordSecret ? <span className="text-anemo">· défini ✓</span> : null}</label>
          <input type="password" autoComplete="off" className={inputClass} value={discordSecret} onChange={(e) => { setDiscordSecret(e.target.value); setSaved(false); }} placeholder={secretPlaceholder(Boolean(view?.hasDiscordSecret), Boolean(view?.envDiscord))} />
        </div>
        <div>
          <label className={labelClass}>Google — Client ID {view?.envGoogle ? <span className="text-anemo">· env ✓</span> : null}</label>
          <input className={inputClass} value={googleId} onChange={(e) => { setGoogleId(e.target.value); setSaved(false); }} placeholder="AUTH_GOOGLE_ID" />
        </div>
        <div>
          <label className={labelClass}>Google — Client Secret {view?.hasGoogleSecret ? <span className="text-anemo">· défini ✓</span> : null}</label>
          <input type="password" autoComplete="off" className={inputClass} value={googleSecret} onChange={(e) => { setGoogleSecret(e.target.value); setSaved(false); }} placeholder={secretPlaceholder(Boolean(view?.hasGoogleSecret), Boolean(view?.envGoogle))} />
        </div>
      </div>

      <p className="mt-3 font-mono text-[0.6rem] text-muted-2">
        Changement pris en compte au prochain redémarrage (cold-start). Un secret invalide ⇒ retour automatique à l'env.
      </p>

      {error ? <p className="mt-2 font-sans text-sm text-[#ffb3a6]">{error}</p> : null}

      <div className="mt-4 flex items-center gap-3">
        <DnaButton variant="gold" onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer les credentials"}
        </DnaButton>
        {saved ? (
          <span className={cn("inline-flex items-center gap-1.5 font-caps text-[0.6rem] uppercase tracking-[0.14em] text-anemo")}>
            <Check className="h-3.5 w-3.5" />
            Enregistré
          </span>
        ) : null}
      </div>
    </DnaPanel>
  );
}
