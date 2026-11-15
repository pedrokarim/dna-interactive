import { locales, type Locale } from "@/i18n/config";
import { embedResponse } from "@/lib/discord-embed/next";
import { resolveDiscordEmbed } from "@/lib/discord-embed/pages";

export const dynamic = "force-dynamic";

/**
 * JSON de l'aperçu Discord d'une page : `/api/discord-embed/fr/characters/falsi`
 * pour `/fr/characters/falsi`. La page y renvoie par
 * `<link rel="discord:component-embed">` (voir `lib/discord-embed/next.ts`).
 *
 * 404 quand la page n'a pas d'aperçu, ou quand le bloc enfreint une règle de
 * Discord : Discord garde alors la carte Open Graph de la page.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; path?: string[] }> },
) {
  const { locale, path = [] } = await params;
  if (!locales.includes(locale as Locale)) return embedResponse(null);
  try {
    return embedResponse(await resolveDiscordEmbed(locale, path.map((segment) => decodeURIComponent(segment))));
  } catch (error) {
    console.error("[discord-embed] aperçu impossible :", locale, path.join("/"), error);
    return embedResponse(null);
  }
}
