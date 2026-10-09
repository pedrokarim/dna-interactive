"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { AuthLinkButton } from "./AuthCard";
import { AuthMessage } from "./AuthPrimitives";

type Status = "idle" | "busy" | "ok" | "invalid";

/**
 * Confirmation de l'adresse email, déclenchée par un clic.
 *
 * Le jeton n'est consommé qu'à l'appui sur le bouton : ouvrir le lien ne
 * suffit plus, pour qu'un robot qui visite les liens d'un email ne puisse pas
 * confirmer l'adresse à la place de son titulaire.
 */
export function VerifyEmailConfirm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>(token ? "idle" : "invalid");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (status === "busy") return;
    setStatus("busy");
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, locale }),
      });
      if (res.ok) {
        setStatus("ok");
        return;
      }
      // Lien invalide ou expiré : état définitif. Toute autre erreur (débit,
      // panne) laisse le bouton, le jeton n'ayant pas été consommé.
      if (res.status === 400) {
        setStatus("invalid");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("genericError"));
    } catch {
      setError(t("genericError"));
    }
    setStatus("idle");
  }

  if (status === "ok") {
    return (
      <>
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
        <h1 className="mt-4 font-display text-2xl text-parch">{t("verifyOkTitle")}</h1>
        <p className="mt-2 font-sans text-sm text-muted">{t("verifyOkBody")}</p>
        <div className="mt-6">
          <AuthLinkButton href="/login">{t("verifyOkCta")}</AuthLinkButton>
        </div>
      </>
    );
  }

  if (status === "invalid") {
    return (
      <>
        <XCircle className="mx-auto h-12 w-12 text-crimson-bright" />
        <h1 className="mt-4 font-display text-2xl text-parch">{t("verifyFailTitle")}</h1>
        <p className="mt-2 font-sans text-sm text-muted">{t("verifyFailBody")}</p>
        <div className="mt-6">
          <AuthLinkButton href="/signup">{t("verifyFailCta")}</AuthLinkButton>
        </div>
      </>
    );
  }

  return (
    <>
      <MailCheck className="mx-auto h-12 w-12 text-gold" />
      <h1 className="mt-4 font-display text-2xl text-parch">{t("verifyConfirmTitle")}</h1>
      <p className="mt-2 font-sans text-sm text-muted">{t("verifyConfirmBody")}</p>
      {error ? (
        <div className="mt-4 text-left">
          <AuthMessage tone="error">{error}</AuthMessage>
        </div>
      ) : null}
      <div className="mt-6">
        <DnaButton type="button" variant="gold" disabled={status === "busy"} onClick={() => void confirm()}>
          {status === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("verifyConfirmCta")}
        </DnaButton>
      </div>
    </>
  );
}
