"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/components/dna";
import { FIELD_WIDTH, AdminFormButton, AdminPanel, AdminStatus, adminInputClass, adminLabelClass } from "./ui";

type AuthConfigView = {
  discordId: string;
  googleId: string;
  hasDiscordSecret: boolean;
  hasGoogleSecret: boolean;
  envDiscord: boolean;
  envGoogle: boolean;
};

/**
 * Identifiants OAuth, surchargeables depuis l'interface.
 *
 * Les secrets ne reviennent jamais du serveur : le champ reste vide et son
 * indicateur dit seulement s'il en existe un. C'est aussi pour ça que ce
 * panneau est séparé des réglages ordinaires – on n'y écrase rien par
 * inadvertance en enregistrant autre chose.
 */
export function AuthConfigPanel() {
  const [view, setView] = useState<AuthConfigView | null>(null);
  const [discordId, setDiscordId] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [discordSecret, setDiscordSecret] = useState("");
  const [googleSecret, setGoogleSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await fetch("/api/admin/auth-config").catch(() => null);
      if (!res?.ok || !alive) return;
      const json = await res.json();
      const config = json.config as AuthConfigView;
      setView(config);
      setDiscordId(config.discordId);
      setGoogleId(config.googleId);
    })();
    return () => {
      alive = false;
    };
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
    has
      ? "•••••••••• — laisser vide pour conserver"
      : env
        ? "hérité de l'environnement — saisir pour surcharger"
        : "Client Secret";

  return (
    <AdminPanel label="Authentification OAuth">
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <p className="font-sans text-[0.76rem] text-muted sm:col-span-2">
          Ces valeurs surchargent les variables d&apos;environnement ; un champ vide conserve celle de
          l&apos;environnement. Les secrets sont chiffrés en base et ne sont jamais renvoyés au navigateur.
        </p>

        <Field
          id="auth-discord-id"
          label="Discord — Client ID"
          value={discordId}
          onChange={(v) => {
            setDiscordId(v);
            setSaved(false);
          }}
          placeholder="AUTH_DISCORD_ID"
          status={view?.envDiscord ? <AdminStatus tone="ok">env</AdminStatus> : null}
        />
        <Field
          id="auth-discord-secret"
          label="Discord — Client Secret"
          type="password"
          value={discordSecret}
          onChange={(v) => {
            setDiscordSecret(v);
            setSaved(false);
          }}
          placeholder={secretPlaceholder(Boolean(view?.hasDiscordSecret), Boolean(view?.envDiscord))}
          status={view?.hasDiscordSecret ? <AdminStatus tone="ok">défini</AdminStatus> : null}
        />
        <Field
          id="auth-google-id"
          label="Google — Client ID"
          value={googleId}
          onChange={(v) => {
            setGoogleId(v);
            setSaved(false);
          }}
          placeholder="AUTH_GOOGLE_ID"
          status={view?.envGoogle ? <AdminStatus tone="ok">env</AdminStatus> : null}
        />
        <Field
          id="auth-google-secret"
          label="Google — Client Secret"
          type="password"
          value={googleSecret}
          onChange={(v) => {
            setGoogleSecret(v);
            setSaved(false);
          }}
          placeholder={secretPlaceholder(Boolean(view?.hasGoogleSecret), Boolean(view?.envGoogle))}
          status={view?.hasGoogleSecret ? <AdminStatus tone="ok">défini</AdminStatus> : null}
        />

        <p className="font-mono text-[0.64rem] text-muted-2 sm:col-span-2">
          Prise en compte au prochain démarrage à froid. Un secret invalide provoque un retour automatique aux
          variables d&apos;environnement.
        </p>

        {error ? <p className="font-sans text-[0.78rem] text-crimson-soft sm:col-span-2">{error}</p> : null}

        <div className="flex items-center gap-3 sm:col-span-2">
          <AdminFormButton variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {saving ? "Enregistrement…" : "Enregistrer les identifiants"}
          </AdminFormButton>
          {saved ? (
            <span className="inline-flex items-center gap-1.5 font-sans text-[0.78rem] text-gold">
              <Check className="h-3.5 w-3.5" />
              Enregistré
            </span>
          ) : null}
        </div>
      </div>
    </AdminPanel>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  status,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "password";
  status?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className={adminLabelClass + " mb-0"} htmlFor={id}>
          {label}
        </label>
        {status}
      </div>
      <input
        id={id}
        type={type}
        autoComplete="off"
        className={cn(adminInputClass, FIELD_WIDTH.medium)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
