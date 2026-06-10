"use client";

import { useAtom } from "jotai";
import { Check, Copy, Gift, RotateCcw, Clock, AlertTriangle } from "lucide-react";
import {
  GAME_CODES,
  usedCodesAtom,
  toggleCodeUsedAtom,
  resetAllCodesAtom,
} from "@/lib/store";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { DnaPanel } from "@/components/dna/Panel";
import { DnaDivider } from "@/components/dna/Divider";

export default function CodesList() {
  const t = useTranslations("codes");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const [usedCodes] = useAtom(usedCodesAtom);
  const [, toggleCodeUsed] = useAtom(toggleCodeUsedAtom);
  const [, resetAllCodes] = useAtom(resetAllCodesAtom);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleCodeClick = (codeId: string) => {
    toggleCodeUsed(codeId);
  };

  const handleResetAll = () => {
    if (confirm(t("resetConfirm"))) {
      resetAllCodes();
    }
  };

  const activeCodes = GAME_CODES.filter((code) => !code.expired);
  const expiredCodes = GAME_CODES.filter((code) => code.expired);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 text-center">
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center border border-gold/30 bg-gold/10 text-gold">
          <Gift className="h-7 w-7" />
        </span>
        <p className="font-caps text-[0.7rem] uppercase tracking-[0.34em] text-gold/80">{tNav("codes")}</p>
        <h1 className="mt-3 font-display text-4xl text-parch md:text-5xl">{t("title")}</h1>
        <DnaDivider className="mx-auto mt-5 max-w-[14rem]" />
        <p className="mx-auto mt-5 max-w-2xl text-parch/80">{t("description")}</p>
      </div>

      <DnaPanel className="mb-6 p-4">
        <p className="text-sm text-gold">
          <strong className="font-caps tracking-[0.08em]">{t("howToUse")}</strong> {t("howToUseSteps")}
        </p>
      </DnaPanel>

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted">
          {t("usedCount", { used: usedCodes.size, total: activeCodes.length })}
          {expiredCodes.length > 0 && ` • ${t("expiredCount", { count: expiredCodes.length })}`}
        </div>
        {usedCodes.size > 0 && (
          <button
            onClick={handleResetAll}
            className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-panel/60 px-4 py-2 text-parch transition-colors hover:border-gold/40 hover:text-gold"
          >
            <RotateCcw className="h-4 w-4" />
            {t("resetAll")}
          </button>
        )}
      </div>

      {/* Codes actifs */}
      <div className="space-y-3">
        {activeCodes.map((gameCode) => {
          const isUsed = usedCodes.has(gameCode.id);
          const isCopied = copiedCode === gameCode.code;

          return (
            <DnaPanel
              key={gameCode.id}
              className={`relative cursor-pointer p-5 transition-all duration-200 ${
                isUsed ? "opacity-60" : "hover:border-gold/45"
              }`}
            >
              <div onClick={() => handleCodeClick(gameCode.id)} className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <code
                      className={`rounded-sm border px-3 py-1 font-mono text-lg ${
                        isUsed ? "border-white/10 bg-panel text-muted line-through" : "border-gold bg-ink text-gold"
                      }`}
                    >
                      {gameCode.code}
                    </code>
                    {gameCode.isNew && (
                      <span className="rounded-sm bg-gold px-2 py-0.5 font-caps text-[0.56rem] uppercase tracking-[0.14em] text-ink">
                        {tCommon("new")}
                      </span>
                    )}
                    {gameCode.expiresAt && (
                      <span className="inline-flex items-center gap-1 rounded-sm border border-pyro/30 bg-pyro/15 px-2 py-0.5 font-caps text-[0.56rem] uppercase tracking-[0.14em] text-pyro">
                        <Clock className="h-3 w-3" />
                        {t("expires", { date: gameCode.expiresAt })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {gameCode.rewards.map((reward, index) => (
                      <span
                        key={index}
                        className={`rounded-sm border px-2 py-0.5 text-sm ${
                          isUsed ? "border-white/10 bg-white/5 text-muted-2" : "border-electro/30 bg-electro/15 text-electro"
                        }`}
                      >
                        {reward}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(gameCode.code);
                    }}
                    className={`grid h-9 w-9 place-items-center rounded-sm transition-colors ${
                      isUsed ? "bg-panel text-muted hover:text-parch" : "border border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
                    }`}
                    title={t("copyCode")}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>

                  <div
                    className={`grid h-6 w-6 place-items-center rounded-full border-2 transition-all ${
                      isUsed ? "border-gold bg-gold text-ink" : "border-white/15 hover:border-gold"
                    }`}
                  >
                    {isUsed && <Check className="h-4 w-4" />}
                  </div>
                </div>
              </div>

              {isCopied && (
                <div className="absolute right-2 top-2 rounded-sm bg-gold px-2 py-0.5 text-xs text-ink">
                  {tCommon("copied")}
                </div>
              )}
            </DnaPanel>
          );
        })}
      </div>

      {/* Codes expirés */}
      {expiredCodes.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-pyro" />
            <h2 className="font-display text-2xl text-parch">{t("expiredTitle")}</h2>
          </div>
          <div className="space-y-3 opacity-75">
            {expiredCodes.map((gameCode) => {
              const isCopied = copiedCode === gameCode.code;

              return (
                <DnaPanel key={gameCode.id} className="relative border-crimson-bright/25 bg-crimson/10 p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <code className="rounded-sm border border-crimson-bright/50 bg-crimson/15 px-3 py-1 font-mono text-lg text-crimson-bright line-through">
                          {gameCode.code}
                        </code>
                        <span className="rounded-sm border border-crimson-bright/30 bg-crimson/15 px-2 py-0.5 font-caps text-[0.56rem] uppercase tracking-[0.14em] text-crimson-bright">
                          {tCommon("expired")}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {gameCode.rewards.map((reward, index) => (
                          <span
                            key={index}
                            className="rounded-sm border border-crimson-bright/30 bg-crimson/15 px-2 py-0.5 text-sm text-crimson-bright/80"
                          >
                            {reward}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(gameCode.code);
                        }}
                        className="grid h-9 w-9 place-items-center rounded-sm border border-crimson-bright/40 bg-crimson/15 text-crimson-bright transition-colors hover:bg-crimson/25"
                        title={t("copyCodeExpired")}
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isCopied && (
                    <div className="absolute right-2 top-2 rounded-sm bg-gold px-2 py-0.5 text-xs text-ink">
                      {tCommon("copied")}
                    </div>
                  )}
                </DnaPanel>
              );
            })}
          </div>
        </div>
      )}

      <DnaPanel className="mt-12 p-6">
        <h3 className="mb-4 font-display text-xl text-parch">{t("importantInfo")}</h3>
        <ul className="space-y-2 text-parch/85">
          {[t("infoOneUse"), t("infoExpire"), t("infoAutoCredit"), t("infoNotWorking")].map((info, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 text-gold">◇</span>
              <span>{info}</span>
            </li>
          ))}
        </ul>
      </DnaPanel>
    </div>
  );
}
