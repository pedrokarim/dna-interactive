"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Lock, Mail, UserRound } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { AuthDivider, AuthField, AuthMessage, OAuthButtons } from "./AuthPrimitives";

export function SignupForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resent, setResent] = useState(false);

  async function resendVerification() {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    }).catch(() => {});
    setResent(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || undefined, email, password, locale }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? t("genericError"));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="grid gap-3">
        <AuthMessage tone="success">{t("verifySent", { email })}</AuthMessage>
        {resent ? (
          <p className="text-center font-sans text-xs text-gold-bright">{t("resendSent")}</p>
        ) : (
          <button
            type="button"
            onClick={resendVerification}
            className="font-sans text-xs text-gold underline underline-offset-2 hover:text-gold-bright"
          >
            {t("resendVerification")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <OAuthButtons
        googleEnabled={googleEnabled}
        callbackUrl={callbackUrl}
        discordLabel={t("continueDiscord")}
        googleLabel={t("continueGoogle")}
      />
      <AuthDivider label={t("or")} />

      <form onSubmit={submit} className="grid gap-3">
        {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
        <AuthField
          label={t("name")}
          icon={<UserRound className="h-4 w-4" />}
          type="text"
          autoComplete="nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthField
          label={t("email")}
          icon={<Mail className="h-4 w-4" />}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label={t("password")}
          icon={<Lock className="h-4 w-4" />}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          label={t("passwordConfirm")}
          icon={<Lock className="h-4 w-4" />}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <DnaButton type="submit" variant="gold" disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("signupCta")}
        </DnaButton>
      </form>
    </div>
  );
}
