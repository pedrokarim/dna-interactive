"use client";

import type { ReactNode } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

/**
 * Provider reCAPTCHA v3, à monter seulement sur les routes qui s'en servent
 * (pour l'instant le formulaire de contact).
 *
 * Avant il était dans `Providers.tsx`, à la racine, et le script Google se
 * chargeait sur toutes les pages. Ici, la simple consultation du site n'appelle
 * plus Google, et le badge ne s'affiche que sur le formulaire (le masquer
 * obligerait à ajouter la mention texte).
 *
 * Un autre formulaire à protéger : l'envelopper avec ce composant, sans
 * remonter le provider à la racine.
 */
export function RecaptchaProvider({ children }: { children: ReactNode }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
