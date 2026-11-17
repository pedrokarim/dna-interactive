/**
 * Côté Next.js : pose l'aperçu Discord dans le `<head>` et sert son JSON.
 *
 * On prend la variante « JSON lié » de la doc Discord : la page porte
 * `<link rel="discord:component-embed" type="application/json" href="…">`, et
 * le JSON vient de `/api/discord-embed/<locale>/<chemin>`.
 *
 * Pas de `<script>` en ligne : en App Router, seul le layout racine écrit dans
 * le `<head>`, et il ne connaît pas les données de la page. Lui faire lire
 * l'adresse de chaque requête rendrait toutes les pages dynamiques, statiques
 * comprises. Le `<link>` passe par `generateMetadata`, que Next met dans le
 * `<head>` pour les robots d'aperçu (Discordbot est dans ses « HTML-limited
 * bots »). Le navigateur d'un visiteur ne reçoit que cette balise.
 */
import type { Metadata } from "next";
import type { ComponentEmbed } from "./components";
import { serializeEmbed } from "./serialize";

export const SITE_URL = "https://dna.ascencia.re";

/**
 * Icônes du layout racine. Next fusionne `icons` en surface : une page qui le
 * déclare écrase celles du layout. Le lien Discord passe par `icons`, donc il
 * les reprend.
 */
export const ROOT_ICONS = {
  // 180 px suffisent (taille de l'icône Apple) : 14 Ko au lieu de 171.
  icon: "/assets/images/logo-180.png",
  apple: "/assets/images/logo-180.png",
} as const;

/** Adresse absolue sur le site ; `null` pour tout ce qui n'est ni http(s) ni un chemin. */
export function absoluteUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return `${SITE_URL}${encodeURI(value)}`;
  return null;
}

/** Adresse d'une page du site : `/fr` + chemin, absolue. */
export function pageUrl(locale: string, path = ""): string {
  return `${SITE_URL}/${locale}${path}`;
}

/** Adresse du JSON de l'aperçu d'une page. */
export function discordEmbedHref(locale: string, path = ""): string {
  return `${SITE_URL}/api/discord-embed/${locale}${path}`;
}

/** À fusionner dans le `Metadata` d'une page qui a un aperçu Discord. */
export function discordEmbedMetadata(locale: string, path = ""): Pick<Metadata, "icons"> {
  return {
    icons: {
      ...ROOT_ICONS,
      other: [{ rel: "discord:component-embed", type: "application/json", url: discordEmbedHref(locale, path) }],
    },
  };
}

/**
 * Réponse de la route du JSON. Un bloc absent ou refusé par `serializeEmbed`
 * répond 404 : Discord retombe alors sur la carte Open Graph de la page.
 */
export function embedResponse(embed: ComponentEmbed | null): Response {
  const json = embed ? serializeEmbed(embed) : null;
  if (!json) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
  }
  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.discord.component-embed+json; charset=utf-8",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
