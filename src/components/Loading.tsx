"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoadingProps {
  /**
   * simple : l'icône seule. withMessage : icône et message. box : toute la
   * hauteur du parent. fullscreen : tout l'écran.
   */
  mode?: "simple" | "withMessage" | "box" | "fullscreen";
  /** Message des modes withMessage, box et fullscreen (par défaut common.loading). */
  message?: string;
  /** Taille de l'icône, en px. */
  size?: number;
  /** Classes ajoutées à l'icône. */
  className?: string;
}

export default function Loading({
  mode = "simple",
  message,
  size = 24,
  className = "",
}: LoadingProps) {
  const t = useTranslations("common");
  const resolvedMessage = message ?? t("loading");
  const spinner = (
    <Loader2
      className={`animate-spin ${className}`}
      size={size}
      strokeWidth={2}
    />
  );

  if (mode === "simple") {
    return spinner;
  }

  if (mode === "withMessage") {
    return (
      <div className="flex items-center space-x-3">
        {spinner}
        <span className="text-muted-2 dark:text-parch/85">{resolvedMessage}</span>
      </div>
    );
  }

  if (mode === "box") {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        {spinner}
        {resolvedMessage && (
          <p className="mt-4 text-muted-2 dark:text-parch/85 text-center">
            {resolvedMessage}
          </p>
        )}
      </div>
    );
  }

  if (mode === "fullscreen") {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="border border-line/30 bg-panel/95 shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-8 flex flex-col items-center space-y-4 max-w-sm mx-4 text-gold">
          {spinner}
          {resolvedMessage && (
            <p className="text-parch text-center font-sans">
              {resolvedMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Raccourcis, un par mode.
export function LoadingSpinner({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return <Loading mode="simple" size={size} className={className} />;
}

export function LoadingWithMessage({
  message,
  size = 24,
}: {
  message: string;
  size?: number;
}) {
  return <Loading mode="withMessage" message={message} size={size} />;
}

export function LoadingBox({
  message,
  size = 32,
}: {
  message?: string;
  size?: number;
}) {
  return <Loading mode="box" message={message} size={size} />;
}

export function LoadingFullscreen({
  message,
  size = 32,
}: {
  message?: string;
  size?: number;
}) {
  return <Loading mode="fullscreen" message={message} size={size} />;
}
