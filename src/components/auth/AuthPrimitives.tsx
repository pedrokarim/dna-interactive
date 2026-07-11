"use client";

import type { ReactNode } from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { DnaField } from "@/components/dna";
import type { DnaFieldProps } from "@/components/dna/Field";

/** Champ avec libellé au-dessus, calé sur DnaField. */
export function AuthField({
  label,
  icon,
  ...rest
}: { label: string; icon?: ReactNode } & DnaFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block font-caps text-[0.6rem] uppercase tracking-[0.16em] text-muted">
        {label}
      </label>
      <DnaField icon={icon} wrapClassName="w-full" {...rest} />
    </div>
  );
}

/** Message d'état (erreur cramoisi / succès doré). */
export function AuthMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 border px-3 py-2.5 font-sans text-sm ${
        tone === "error"
          ? "border-crimson-bright/40 bg-crimson/10 text-[#ffb3a6]"
          : "border-gold/40 bg-gold/10 text-gold-bright"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="currentColor">
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .079.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
  </svg>
);

/** Boutons OAuth (Discord toujours, Google si activé). */
export function OAuthButtons({
  googleEnabled,
  callbackUrl,
  discordLabel,
  googleLabel,
}: {
  googleEnabled: boolean;
  callbackUrl: string;
  discordLabel: string;
  googleLabel: string;
}) {
  const base =
    "flex w-full items-center justify-center gap-2.5 rounded-md border px-4 py-2.5 font-sans text-sm transition-colors";
  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => void signIn("discord", { callbackUrl })}
        className={`${base} border-[#5865F2]/50 bg-[#5865F2]/10 text-parch hover:border-[#5865F2] hover:bg-[#5865F2]/20`}
      >
        <DiscordIcon />
        {discordLabel}
      </button>
      {googleEnabled ? (
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl })}
          className={`${base} border-white/20 bg-white/5 text-parch hover:border-white/45 hover:bg-white/10`}
        >
          <GoogleIcon />
          {googleLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Séparateur « ou ». */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-white/12" />
      <span className="font-caps text-[0.56rem] uppercase tracking-[0.18em] text-muted-2">{label}</span>
      <span className="h-px flex-1 bg-white/12" />
    </div>
  );
}
