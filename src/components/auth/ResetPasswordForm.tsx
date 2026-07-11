"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, Lock } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { AuthField, AuthMessage } from "./AuthPrimitives";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return <AuthMessage tone="error">{t("resetBadLink")}</AuthMessage>;
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
    const res = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
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
      <div className="grid gap-4">
        <AuthMessage tone="success">{t("resetDone")}</AuthMessage>
        <Link href="/login" className="text-center font-sans text-sm text-gold hover:text-gold-bright">
          {t("goToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      {error ? <AuthMessage tone="error">{error}</AuthMessage> : null}
      <AuthField
        label={t("newPassword")}
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
        {t("resetCta")}
      </DnaButton>
    </form>
  );
}
