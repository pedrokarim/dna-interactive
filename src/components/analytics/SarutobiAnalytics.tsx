"use client";

import Script from "next/script";

import { activateSarutobi } from "@/lib/analytics";

const projectToken = process.env.NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN?.trim();
const host = (process.env.NEXT_PUBLIC_SARUTOBI_HOST?.trim() || "https://sarutobi.ascencia.re").replace(/\/+$/, "");
const enableLocal = process.env.NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL === "true";
const debug = process.env.NEXT_PUBLIC_SARUTOBI_DEBUG === "true";

export function SarutobiAnalytics() {
  if (!projectToken) return null;

  return (
    <Script
      id="sarutobi-analytics"
      src={`${host}/s.js`}
      strategy="afterInteractive"
      data-site={projectToken}
      data-host={host}
      data-enabled={enableLocal ? "true" : undefined}
      data-debug={debug ? "true" : undefined}
      onReady={activateSarutobi}
    />
  );
}
