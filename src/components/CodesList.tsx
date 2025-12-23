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

export default function CodesList() {
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
    if (confirm("Êtes-vous sûr de vouloir réinitialiser tous les codes ?")) {
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
          <Gift className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-bold text-white">Codes de Rédemption</h1>
        </div>
        <p className="text-gray-300 text-lg leading-relaxed">
          Voici la liste des codes actifs pour Duet Night Abyss. Cliquez sur un
          code pour le marquer comme utilisé. Les codes utilisés seront
          sauvegardés localement et barrés.
        </p>
        <div className="mt-4 p-4 bg-indigo-950/50 border border-indigo-500/30 rounded-lg">
          <p className="text-sm text-indigo-200">
            <strong>Comment utiliser :</strong> Dans le jeu, allez dans
            Paramètres → Consommables → Code de Rédemption
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-400">
          {usedCodes.size} / {activeCodes.length} codes actifs utilisés
          {expiredCodes.length > 0 && ` • ${expiredCodes.length} codes expirés`}
        </div>
        {usedCodes.size > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Tout réinitialiser
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
                    ? "bg-slate-800/50 border-gray-600 opacity-60"
                    : "bg-linear-to-r from-slate-800/50 to-slate-900/50 border-indigo-500/30 hover:border-indigo-400/50 hover:from-slate-800/70 hover:to-slate-900/70"
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
                            ? "bg-gray-700 border-gray-600 text-gray-400 line-through"
                            : "bg-indigo-950 border-indigo-500 text-indigo-200"
                        }
                      `}
                    >
                      {gameCode.code}
                    </code>
                    {gameCode.isNew && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">
                        NOUVEAU
                      </span>
                    )}
                    {gameCode.expiresAt && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-orange-600/20 border border-orange-500/30 text-orange-300 text-xs rounded-full font-medium">
                        <Clock className="w-3 h-3" />
                        Expire {gameCode.expiresAt}
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
                              ? "bg-gray-700 border-gray-600 text-gray-500"
                              : "bg-purple-950 border-purple-500/30 text-purple-200"
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
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-400"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }
                    `}
                    title="Copier le code"
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
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-gray-500 hover:border-indigo-400"
                      }
                    `}
                  >
                    {isUsed && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isCopied && (
                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  Copié !
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
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Codes expirés</h2>
          </div>
          <div className="space-y-4 opacity-75">
            {expiredCodes.map((gameCode) => {
              const isCopied = copiedCode === gameCode.code;

              return (
                <div
                  key={gameCode.id}
                  className="relative p-6 rounded-xl border bg-linear-to-r from-red-950/20 to-orange-950/20 border-red-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-lg font-mono px-3 py-1 rounded border bg-red-950 border-red-500 text-red-300 line-through">
                          {gameCode.code}
                        </code>
                        <span className="px-2 py-1 bg-red-600/20 border border-red-500/30 text-red-400 text-xs rounded-full font-medium">
                          EXPIRÉ
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {gameCode.rewards.map((reward, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-sm rounded border bg-red-950/50 border-red-500/30 text-red-300/70"
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
                        className="p-2 rounded-lg transition-colors bg-red-600 hover:bg-red-500 text-white"
                        title="Copier le code (expiré)"
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
                    <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Copié !
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-12 p-6 bg-slate-800/50 border border-indigo-500/20 rounded-xl">
        <h3 className="text-xl font-semibold text-white mb-4">
          Informations importantes
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-1">•</span>
            <span>
              Les codes peuvent être utilisés une seule fois par compte
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-1">•</span>
            <span>
              Certains codes peuvent expirer, vérifiez régulièrement les mises à
              jour
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-1">•</span>
            <span>
              Les récompenses sont automatiquement créditées à votre compte
              après validation
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-1">•</span>
            <span>
              Si un code ne fonctionne pas, il peut avoir expiré ou déjà été
              utilisé
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
