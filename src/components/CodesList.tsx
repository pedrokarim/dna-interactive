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

export default function CodesList() {
  const t = useTranslations("codes");
  const tCommon = useTranslations("common");
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

  // Séparer les codes actifs et expirés
  const activeCodes = GAME_CODES.filter(code => !code.expired);
  const expiredCodes = GAME_CODES.filter(code => code.expired);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-bold text-parch">{t("title")}</h1>
        </div>
        <p className="text-parch/85 text-lg leading-relaxed">
          {t("description")}
        </p>
        <div className="mt-4 p-4 bg-ink/50 border border-gold/30 rounded-lg">
          <p className="text-sm text-gold">
            <strong>{t("howToUse")}</strong> {t("howToUseSteps")}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted">
          {t("usedCount", { used: usedCodes.size, total: activeCodes.length })}
          {expiredCodes.length > 0 && ` • ${t("expiredCount", { count: expiredCodes.length })}`}
        </div>
        {usedCodes.size > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 bg-panel hover:bg-panel text-parch rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t("resetAll")}
          </button>
        )}
      </div>

      {/* Codes actifs */}
      <div className="space-y-4">
        {activeCodes.map((gameCode) => {
          const isUsed = usedCodes.has(gameCode.id);
          const isCopied = copiedCode === gameCode.code;

          return (
            <div
              key={gameCode.id}
              onClick={() => handleCodeClick(gameCode.id)}
              className={`
                relative p-6 rounded-xl border transition-all duration-200 cursor-pointer
                ${
                  isUsed
                    ? "bg-panel/50 border-white/10 opacity-60"
                    : "bg-linear-to-r from-panel/50 to-panel/50 border-gold/30 hover:border-gold/50 hover:from-panel/70 hover:to-panel/70"
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <code
                      className={`
                        text-lg font-mono px-3 py-1 rounded border
                        ${
                          isUsed
                            ? "bg-panel border-white/10 text-muted line-through"
                            : "bg-ink border-gold text-gold"
                        }
                      `}
                    >
                      {gameCode.code}
                    </code>
                    {gameCode.isNew && (
                      <span className="px-2 py-1 bg-gold text-ink text-xs rounded-full font-medium">
                        {tCommon("new")}
                      </span>
                    )}
                    {gameCode.expiresAt && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-pyro/20 border border-pyro/30 text-pyro text-xs rounded-full font-medium">
                        <Clock className="w-3 h-3" />
                        {t("expires", { date: gameCode.expiresAt })}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {gameCode.rewards.map((reward, index) => (
                      <span
                        key={index}
                        className={`
                          px-2 py-1 text-sm rounded border
                          ${
                            isUsed
                              ? "bg-white/5 border-white/10 text-muted-2"
                              : "bg-electro/15 border-electro/30 text-electro"
                          }
                        `}
                      >
                        {reward}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(gameCode.code);
                    }}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${
                        isUsed
                          ? "bg-panel hover:bg-panel text-muted"
                          : "bg-gold hover:bg-gold text-parch"
                      }
                    `}
                    title={t("copyCode")}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${
                        isUsed
                          ? "bg-gold border-gold text-ink"
                          : "border-white/15 hover:border-gold"
                      }
                    `}
                  >
                    {isUsed && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isCopied && (
                <div className="absolute top-2 right-2 bg-gold text-ink text-xs px-2 py-1 rounded">
                  {tCommon("copied")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Codes expirés */}
      {expiredCodes.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-pyro" />
            <h2 className="text-2xl font-bold text-parch">{t("expiredTitle")}</h2>
          </div>
          <div className="space-y-4 opacity-75">
            {expiredCodes.map((gameCode) => {
              const isCopied = copiedCode === gameCode.code;

              return (
                <div
                  key={gameCode.id}
                  className="relative p-6 rounded-xl border bg-linear-to-r from-crimson-bright/20 to-pyro/20 border-crimson-bright/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-mono px-3 py-1 rounded border bg-crimson-bright border-crimson-bright text-crimson-bright line-through">
                          {gameCode.code}
                        </code>
                        <span className="px-2 py-1 bg-crimson-bright/20 border border-crimson-bright/30 text-crimson-bright text-xs rounded-full font-medium">
                          {tCommon("expired")}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {gameCode.rewards.map((reward, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-sm rounded border bg-crimson-bright/50 border-crimson-bright/30 text-crimson-bright/70"
                          >
                            {reward}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(gameCode.code);
                        }}
                        className="p-2 rounded-lg transition-colors bg-crimson-bright hover:bg-crimson-bright text-parch"
                        title={t("copyCodeExpired")}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isCopied && (
                    <div className="absolute top-2 right-2 bg-gold text-ink text-xs px-2 py-1 rounded">
                      {tCommon("copied")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12 p-6 bg-panel/50 border border-gold/20 rounded-xl">
        <h3 className="text-xl font-semibold text-parch mb-4">
          {t("importantInfo")}
        </h3>
        <ul className="space-y-2 text-parch/85">
          <li className="flex items-start gap-2">
            <span className="text-gold mt-1">•</span>
            <span>
              {t("infoOneUse")}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold mt-1">•</span>
            <span>
              {t("infoExpire")}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold mt-1">•</span>
            <span>
              {t("infoAutoCredit")}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold mt-1">•</span>
            <span>
              {t("infoNotWorking")}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
