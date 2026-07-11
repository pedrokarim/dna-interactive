"use client";

import type { ReactNode } from "react";
import { signIn } from "next-auth/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { DnaField } from "@/components/dna";
import type { DnaFieldProps } from "@/components/dna/Field";
import { DiscordIcon, GoogleIcon } from "@/components/icons/BrandIcons";

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

/** Boutons OAuth (Discord toujours en blurple, Google en or si activé). */
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
        className={`${base} border-[#5865F2] bg-[#5865F2] text-white hover:bg-[#4752c4] hover:border-[#4752c4]`}
      >
        <DiscordIcon size={17} />
        {discordLabel}
      </button>
      {googleEnabled ? (
        <button
          type="button"
          onClick={() => void signIn("google", { callbackUrl })}
          className={`${base} border-gold/50 bg-gold/10 text-gold-bright hover:border-gold hover:bg-gold/18`}
        >
          <GoogleIcon size={16} />
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
