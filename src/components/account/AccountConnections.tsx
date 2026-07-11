"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Check, KeyRound, Link2, Loader2, Unlink } from "lucide-react";
import { DnaButton } from "@/components/dna";
import { AuthMessage } from "@/components/auth/AuthPrimitives";

type Provider = "discord" | "google";

export function AccountConnections({
  linkedProviders,
  hasPassword,
  googleEnabled,
  linkError,
}: {
  linkedProviders: Provider[];
  hasPassword: boolean;
  googleEnabled: boolean;
  linkError?: boolean;
}) {
  const t = useTranslations("account");
  const locale = useLocale();
  const linked = new Set(linkedProviders);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState<Provider | null>(null);
  const [unlinkBusy, setUnlinkBusy] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const providers: Provider[] = googleEnabled ? ["discord", "google"] : ["discord"];
  const callbackUrl = `/${locale}/profile`;

  // Déliaison autorisée seulement s'il reste ≥1 méthode de connexion après coup.
  function canUnlink(provider: Provider): boolean {
    return linkedProviders.filter((p) => p !== provider).length + (hasPassword ? 1 : 0) >= 1;
  }

  async function doUnlink(provider: Provider) {
    if (unlinkBusy) return;
    setUnlinkBusy(true);
    setUnlinkError(null);
    const res = await fetch("/api/account/link", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    if (res.ok) {
      window.location.reload();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setUnlinkError(data.error ?? t("connGenericError"));
    setUnlinkBusy(false);
    setConfirmUnlink(null);
  }

  async function requestPassword() {
    if (pwBusy) return;
    setPwBusy(true);
    setPwError(null);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    const data = await res.json().catch(() => ({}));
    setPwBusy(false);
    if (!res.ok) {
      setPwError(data.error ?? t("connGenericError"));
      return;
    }
    setPwSent(true);
  }

  return (
    <div className="grid gap-3">
      {linkError ? <AuthMessage tone="error">{t("connLinkError")}</AuthMessage> : null}
      {unlinkError ? <AuthMessage tone="error">{unlinkError}</AuthMessage> : null}

      {providers.map((provider) => {
        const isLinked = linked.has(provider);
        const label = provider === "discord" ? "Discord" : "Google";
        return (
          <div
            key={provider}
            className="flex items-center justify-between gap-3 border border-white/12 bg-white/[0.03] px-3 py-2.5"
          >
            <span className="font-sans text-sm text-parch">{label}</span>
            {isLinked ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-caps text-[0.58rem] uppercase tracking-[0.14em] text-gold">
                  <Check className="h-3.5 w-3.5" />
                  {t("connLinked")}
                </span>
                {canUnlink(provider) ? (
                  confirmUnlink === provider ? (
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void doUnlink(provider)}
                        disabled={unlinkBusy}
                        className="border border-crimson-bright/50 bg-crimson/15 px-2.5 py-1 font-caps text-[0.54rem] uppercase tracking-[0.12em] text-[#ffb3a6] transition-colors hover:border-crimson-bright disabled:opacity-50"
                      >
                        {t("connUnlinkConfirm")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmUnlink(null)}
                        className="font-caps text-[0.54rem] uppercase tracking-[0.12em] text-muted hover:text-parch"
                      >
                        {t("connUnlinkCancel")}
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmUnlink(provider)}
                      className="inline-flex items-center gap-1 font-caps text-[0.54rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-[#ffb3a6]"
                    >
                      <Unlink className="h-3 w-3" />
                      {t("connUnlink")}
                    </button>
                  )
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void signIn(provider, { callbackUrl })}
                className="inline-flex items-center gap-1.5 border border-gold/40 bg-gold/10 px-3 py-1.5 font-caps text-[0.56rem] uppercase tracking-[0.14em] text-gold-bright transition-colors hover:border-gold hover:bg-gold/20"
              >
                <Link2 className="h-3.5 w-3.5" />
                {t("connLink")}
              </button>
            )}
          </div>
        );
      })}

      {/* Mot de passe natif */}
      <div className="border border-white/12 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 font-sans text-sm text-parch">
            <KeyRound className="h-4 w-4 text-gold" />
            {t("connPassword")}
          </span>
          <span className="font-caps text-[0.56rem] uppercase tracking-[0.14em] text-muted">
            {hasPassword ? t("connPasswordSet") : t("connPasswordNone")}
          </span>
        </div>
        {pwSent ? (
          <p className="mt-2 font-sans text-xs text-gold-bright">{t("connPasswordEmailSent")}</p>
        ) : (
          <div className="mt-2">
            {pwError ? (
              <p className="mb-2 font-sans text-xs text-[#ffb3a6]">{pwError}</p>
            ) : null}
            <DnaButton variant="ghost" onClick={requestPassword} disabled={pwBusy} className="px-4 py-1.5 text-xs">
              {pwBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {hasPassword ? t("connPasswordChange") : t("connPasswordDefine")}
            </DnaButton>
          </div>
        )}
      </div>
    </div>
  );
}
