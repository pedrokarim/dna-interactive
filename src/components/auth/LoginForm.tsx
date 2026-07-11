"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { AuthDivider, AuthField, AuthMessage, OAuthButtons } from "./AuthPrimitives";

export function LoginForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resent, setResent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNeedsVerify(false);
    setResent(false);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      // Distinguer "email non vérifié" d'un mauvais identifiant.
      const status = await fetch("/api/auth/login-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
        .then((r) => r.json())
        .catch(() => ({ needsVerification: false }));
      setBusy(false);
      if (status?.needsVerification) {
        setNeedsVerify(true);
        setError(t("loginErrorUnverified"));
      } else {
        setError(t("loginError"));
      }
      return;
    }
    window.location.assign(callbackUrl);
  }

  async function resendVerification() {
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    }).catch(() => {});
    setResent(true);
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
        {needsVerify ? (
          resent ? (
            <AuthMessage tone="success">{t("resendSent")}</AuthMessage>
          ) : (
            <button
              type="button"
              onClick={resendVerification}
              className="text-left font-sans text-xs text-gold underline underline-offset-2 hover:text-gold-bright"
            >
              {t("resendVerification")}
            </button>
          )
        ) : null}
        <AuthField
          label={t("email")}
          icon={<Mail className="h-4 w-4" />}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <AuthField
            label={t("password")}
            icon={<Lock className="h-4 w-4" />}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="font-sans text-xs text-gold hover:text-gold-bright">
              {t("forgotLink")}
            </Link>
          </div>
        </div>
        <DnaButton type="submit" variant="gold" disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("loginCta")}
        </DnaButton>
      </form>
    </div>
  );
}
