import "server-only";
import { getTranslations } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

/**
 * Locale à utiliser pour les réponses d'une route API.
 *
 * Les routes `/api/*` sont hors du matcher du middleware next-intl : elles n'ont
 * donc pas de préfixe de langue dans l'URL. On retombe sur, dans l'ordre :
 * le cookie `NEXT_LOCALE` (posé par le sélecteur de langue et le middleware),
 * l'en-tête `Accept-Language`, puis la locale par défaut.
 */
export function getApiLocale(request: Request): Locale {
  const cookie = request.headers.get("cookie");
  const fromCookie = cookie?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1];
  if (fromCookie && locales.includes(fromCookie as Locale)) return fromCookie as Locale;

  // `fr-FR,fr;q=0.9,en;q=0.8` → on teste chaque tag, préfixe compris.
  const accept = request.headers.get("accept-language");
  if (accept) {
    for (const part of accept.split(",")) {
      const tag = part.split(";")[0]?.trim().toLowerCase();
      if (!tag) continue;
      const candidate = ACCEPT_LANGUAGE_ALIASES[tag] ?? ACCEPT_LANGUAGE_ALIASES[tag.split("-")[0]] ?? tag;
      if (locales.includes(candidate as Locale)) return candidate as Locale;
    }
  }

  return defaultLocale;
}

/** Codes BCP 47 courants → locale du site (jp/kr/tc ne sont pas des codes standard). */
const ACCEPT_LANGUAGE_ALIASES: Record<string, string> = {
  ja: "jp",
  ko: "kr",
  "zh-tw": "tc",
  "zh-hk": "tc",
  "zh-hant": "tc",
  zh: "tc",
};

/**
 * Traducteur des messages renvoyés au client par une route API.
 * Utiliser pour toute chaîne que le front affiche telle quelle.
 */
export async function getApiTranslator(request: Request) {
  return getTranslations({ locale: getApiLocale(request), namespace: "apiErrors" });
}
