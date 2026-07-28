"use client";

import type { ReactNode } from "react";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

/**
 * Provider reCAPTCHA v3, monté UNIQUEMENT sur les routes qui en ont besoin
 * (aujourd'hui : le formulaire de contact).
 *
 * Il était auparavant dans `Providers.tsx`, donc dans le layout racine : le
 * script Google se chargeait sur toutes les pages du site — carte, personnages,
 * items — alors qu'aucune ne l'utilise. Trois raisons de le cantonner ici :
 *
 * - performance : un script tiers en moins sur l'ensemble du site ;
 * - vie privée : plus d'appel aux serveurs Google pour une simple consultation ;
 * - conformité : le badge reCAPTCHA n'apparaît que là où il est légitime, ce qui
 *   évite d'avoir à ajouter la mention textuelle exigée quand on le masque.
 *
 * Si un autre formulaire doit être protégé un jour, l'envelopper avec ce
 * composant plutôt que de remonter le provider à la racine.
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
