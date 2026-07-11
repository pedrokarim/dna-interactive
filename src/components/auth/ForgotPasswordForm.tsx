"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mail } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { AuthField, AuthMessage } from "./AuthPrimitives";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    await fetch("/api/auth/password/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    }).catch(() => {});
    setBusy(false);
    setDone(true);
  }

  if (done) {
    return <AuthMessage tone="success">{t("resetRequested")}</AuthMessage>;
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <AuthField
        label={t("email")}
        icon={<Mail className="h-4 w-4" />}
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <DnaButton type="submit" variant="gold" disabled={busy} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t("resetRequestCta")}
      </DnaButton>
    </form>
  );
}
