"use client";

/**
 * Mesure d'audience avec Sarutobi, via le paquet npm.
 *
 * Avant on chargeait `s.js` depuis sarutobi.ascencia.re avec une balise
 * <script>. Ça faisait une requête de plus vers un autre domaine, on n'avait
 * pas accès à `environment` ni à `beforeSend`, et la version changeait à
 * chaque déploiement de Sarutobi. Le paquet, lui, est épinglé dans package.json.
 */

import { sarutobi, type Props } from "@ascencia/sarutobi-react";

import { locales } from "@/i18n/config";

export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsProperties = Record<string, AnalyticsPrimitive>;

/**
 * Clé publique du site.
 *
 * La prod utilise `NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN`, c'est celle que
 * documentent env.local.example et le README. On accepte aussi
 * `NEXT_PUBLIC_SARUTOBI_SITE_ID` parce que c'est le nom que donne l'écran
 * d'installation de Sarutobi. Même valeur ; si les deux sont posées, SITE_ID
 * gagne.
 *
 * Next remplace `process.env.NEXT_PUBLIC_*` tel quel à la compilation : il
 * faut écrire l'accès en toutes lettres (un accès calculé n'est pas remplacé).
 * Une variable absente devient `undefined` et le `||` passe à la suivante.
 */
function siteId(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SARUTOBI_SITE_ID?.trim() ||
    process.env.NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN?.trim() ||
    undefined
  );
}

/**
 * Chemins jamais collectés.
 *
 * `*` ne traverse pas le `/`, donc un motif couvre les sept locales et on n'a
 * rien à ajouter avec une nouvelle langue.
 *
 * `/admin` : quelques comptes seulement, ça fausserait les chiffres des pages
 * publiques. `/reset-password` et `/verify-email` : on y arrive par un lien
 * d'e-mail dont l'URL porte un jeton à usage unique. Sarutobi ne garderait pas
 * la query, mais autant ne pas l'envoyer du tout.
 *
 * `/login` et `/signup` restent mesurées : pas de secret dans l'URL, et c'est
 * là qu'on suit la conversion.
 */
const EXCLUDED_PATHS = ["/*/admin/**", "/*/reset-password", "/*/verify-email"];

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

/**
 * Retire le préfixe de locale du chemin mesuré.
 *
 * Avec `localePrefix: 'always'`, une même page arrive sous sept chemins et
 * les stats se retrouvent éclatées par langue.
 *
 * La langue reste connue : `setContext` la met dans l'enveloppe du lot, donc
 * sur tous les événements, pageviews comprises (une pageview n'a pas de
 * propriétés à elle, seuls les événements perso en ont).
 *
 * L'exclusion passe avant ce filtre, sur l'URL d'origine : d'où les motifs avec
 * préfixe plus haut.
 */
function stripLocale(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.pathname = url.pathname.replace(LOCALE_PREFIX, "") || "/";
    return url.toString();
  } catch {
    // URL illisible : on l'envoie quand même, le serveur tranchera.
    return rawUrl;
  }
}

/**
 * `true` une fois `startAnalytics` passé.
 *
 * Avant l'init, le SDK ignore les appels sans rien dire. Or React lance les
 * effets des enfants avant ceux des parents : un composant profond qui
 * identifie au montage passe avant l'init de la racine. La file ci-dessous
 * rejoue ce qui est arrivé trop tôt.
 */
let ready = false;

type DeferredAction =
  | { kind: "capture"; name: string; properties?: AnalyticsProperties }
  | { kind: "identify"; distinctId: string; properties?: AnalyticsProperties }
  | { kind: "reset" };

const MAX_PENDING = 50;
const pending: DeferredAction[] = [];
let lastIdentity: string | null = null;

function run(action: DeferredAction): void {
  if (action.kind === "capture") sarutobi.capture(action.name, action.properties as Props);
  if (action.kind === "identify") sarutobi.identify(action.distinctId, action.properties as Props);
  if (action.kind === "reset") sarutobi.reset();
}

function deferOrRun(action: DeferredAction): void {
  if (ready) {
    run(action);
    return;
  }
  // Sans clé configurée, ready reste à false pour toujours : on borne la file.
  if (pending.length >= MAX_PENDING) pending.shift();
  pending.push(action);
}

/**
 * Démarre la collecte. Appelée une fois, depuis la racine cliente.
 *
 * Sans clé configurée, ne fait rien : en dev ou en préprod sans clé, ni erreur
 * ni requête.
 */
export function startAnalytics(locale: string): void {
  const site = siteId();
  if (!site || ready) return;

  sarutobi.init({
    siteId: site,
    ...(process.env.NEXT_PUBLIC_SARUTOBI_HOST?.trim()
      ? { host: process.env.NEXT_PUBLIC_SARUTOBI_HOST.trim() }
      : {}),
    // Consentement par défaut, voulu : la collecte démarre dès la première
    // visite, sans bandeau. Sans cette ligne le SDK reste en `pending` et ne
    // collecte rien.
    //
    // Un refus déjà enregistré passe devant : le SDK relit l'état stocké avant
    // ce défaut, donc `refuseAnalytics()` tient après un rechargement.
    consent: "granted",
    excludePaths: EXCLUDED_PATHS,
    environment: process.env.NEXT_PUBLIC_SARUTOBI_ENVIRONMENT?.trim() || "production",
    debug: process.env.NEXT_PUBLIC_SARUTOBI_DEBUG === "true",
    ...(process.env.NEXT_PUBLIC_SARUTOBI_ENABLE_LOCAL === "true" ? { enabled: true } : {}),
    beforeSend: (event) => ({ ...event, u: stripLocale(event.u) }),
  });

  sarutobi.setContext({ locale });

  ready = true;
  while (pending.length > 0) {
    const action = pending.shift();
    if (action) run(action);
  }
}

/** Suit un changement de langue sans réinitialiser le SDK. */
export function trackLocale(locale: string): void {
  if (ready) sarutobi.setContext({ locale });
}

export function captureAnalytics(name: string, properties?: AnalyticsProperties): void {
  const normalized = name.trim();
  if (!normalized) return;
  deferOrRun({ kind: "capture", name: normalized, properties });
}

/**
 * Rattache la session à un compte.
 *
 * La signature évite de renvoyer `$identify` à chaque rendu : l'appelant suit
 * la session NextAuth, dont l'objet change plus souvent que son contenu.
 */
export function identifyAnalytics(distinctId: string, properties?: AnalyticsProperties): void {
  const normalized = distinctId.trim();
  if (!normalized) return;
  const signature = `${normalized}:${JSON.stringify(properties ?? {})}`;
  if (signature === lastIdentity) return;
  lastIdentity = signature;
  deferOrRun({ kind: "identify", distinctId: normalized, properties });
}

export function resetAnalytics(): void {
  lastIdentity = null;
  deferOrRun({ kind: "reset" });
}

/**
 * Abonnés à l'état de refus.
 *
 * Le consentement est dans le localStorage, hors de React. `useSyncExternalStore`
 * peut le lire sans écart serveur/client, mais il lui faut un abonnement. Le SDK
 * n'émet rien, alors on notifie depuis les deux fonctions qui changent l'état.
 */
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
  for (const subscriber of subscribers) subscriber();
}

export function subscribeToAnalyticsOptOut(callback: () => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/** À appeler quand le visiteur accepte la mesure d'audience. */
export function acceptAnalytics(): void {
  sarutobi.setConsent("granted");
  notifySubscribers();
}

/** À appeler quand il la refuse, ou revient sur son accord. */
export function refuseAnalytics(): void {
  sarutobi.setConsent("denied");
  notifySubscribers();
}

/** État courant du refus, côté navigateur. */
export function isAnalyticsOptedOut(): boolean {
  return sarutobi.isOptedOut();
}

/**
 * Ce que le serveur suppose : rien n'est refusé.
 *
 * Il ne peut pas savoir, le choix est dans le navigateur. Cet état n'est donc
 * pas fiable pendant l'hydratation : la bascule affiche un libellé d'attente.
 */
export function isAnalyticsOptedOutOnServer(): boolean {
  return false;
}
