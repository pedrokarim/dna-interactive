"use client";

/**
 * Mesure d'audience Sarutobi.
 *
 * Le site chargeait auparavant `https://sarutobi.ascencia.re/s.js` par une
 * balise `<script>`. Cette voie existe pour les sites sans bundler ; ici il y
 * en a un, et elle coûtait trois choses :
 *
 * - **une requête vers un tiers** avant la moindre mesure, et rien du tout si
 *   ce tiers est lent ou coupé ;
 * - **une API réduite** : l'amorce automatique ne lit que quelques attributs
 *   `data-*`. Ni `environment`, ni `beforeSend`, ni `release` n'y sont
 *   atteignables — or les deux premiers manquaient ;
 * - **une version non épinglée** : le fichier servi suit les déploiements de
 *   Sarutobi, donc le site changeait de SDK sans que rien ne le décide ici.
 *
 * Le paquet npm règle les trois. Il est épinglé dans `package.json` et entre
 * dans le bundle.
 */

import { sarutobi, type Props } from "@ascencia/sarutobi-react";

import { locales } from "@/i18n/config";

export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsProperties = Record<string, AnalyticsPrimitive>;

/**
 * Clé publique du site.
 *
 * **`NEXT_PUBLIC_SARUTOBI_PROJECT_TOKEN` est le nom en service** : c'est lui
 * qui est posé en production, et c'est donc lui que documentent `env.local.example`
 * et le README. `NEXT_PUBLIC_SARUTOBI_SITE_ID` est accepté parce que c'est le
 * nom que l'écran d'installation de Sarutobi donne à copier — quelqu'un qui
 * repart de cet écran ne doit pas tomber sur une variable ignorée.
 *
 * Les deux désignent la même valeur ; le second gagne quand les deux sont
 * posés. Rien à migrer tant que le déploiement porte le premier.
 *
 * Next.js remplace `process.env.NEXT_PUBLIC_*` littéralement à la compilation :
 * l'accès s'écrit en toutes lettres, un accès calculé ne serait pas substitué,
 * et une variable absente devient `undefined` — ce qui fait bien tomber le `||`
 * sur la branche suivante.
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
 * `*` ne traverse pas le séparateur, donc un seul motif couvre les sept
 * locales — les écrire une par une serait sept occasions d'en oublier une au
 * prochain ajout de langue.
 *
 * - **`/admin`** n'est pas de l'audience : quelques comptes, et des visites qui
 *   fausseraient les chiffres des pages publiques sans rien apprendre.
 * - **`/reset-password` et `/verify-email`** sont des atterrissages de lien
 *   e-mail portant un jeton à usage unique dans leur query. Sarutobi ne
 *   conserve la query que sur allowlist explicite, donc le jeton ne serait pas
 *   stocké — mais ces pages n'apprennent rien non plus, et la meilleure façon
 *   de ne pas divulguer un secret reste de ne pas l'envoyer.
 *
 * `/login` et `/signup` restent mesurées : ce sont des étapes de conversion,
 * elles n'ont pas de secret dans l'URL, et les retirer aveuglerait la seule
 * question qu'on se pose à leur sujet.
 */
const EXCLUDED_PATHS = ["/*/admin/**", "/*/reset-password", "/*/verify-email"];

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

/**
 * Retire le préfixe de locale du chemin mesuré.
 *
 * `localePrefix: 'always'` met la langue dans chaque URL, donc une même page
 * arrive sous sept chemins. Sur sept jours, cinquante pages réelles étaient
 * comptées comme soixante-dix-sept : chaque classement, chaque entonnoir et
 * chaque comparaison partaient divisés par la langue du visiteur.
 *
 * La langue n'est pas perdue pour autant — `setContext` la pose dans
 * l'enveloppe du lot, donc elle voyage sur *tous* les événements, pageviews
 * comprises. C'est la seule façon de l'avoir : une pageview n'a pas de
 * propriétés sur le fil, seuls les événements personnalisés en ont.
 *
 * L'exclusion, elle, s'applique **avant** ce filtre et sur l'URL d'origine —
 * d'où les motifs préfixés plus haut.
 */
function stripLocale(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.pathname = url.pathname.replace(LOCALE_PREFIX, "") || "/";
    return url.toString();
  } catch {
    // Une URL illisible n'est pas une raison de perdre l'événement : le serveur
    // la rejettera lui-même s'il ne sait pas la lire.
    return rawUrl;
  }
}

/**
 * `true` une fois `demarrerAnalytics` passé.
 *
 * Le SDK ne lève pas avant son initialisation, il ignore simplement l'appel —
 * ce qui suffirait si l'ordre était garanti. Il ne l'est pas : React exécute
 * les effets des enfants **avant** ceux des parents, donc un composant profond
 * qui identifie au montage parle avant que la racine ait initialisé. D'où la
 * petite file ci-dessous, qui rejoue ce qui est arrivé trop tôt.
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
  // Borne haute : sans clé configurée, `pret` reste faux pour toujours et la
  // file grandirait sans fin.
  if (pending.length >= MAX_PENDING) pending.shift();
  pending.push(action);
}

/**
 * Démarre la collecte. Appelée une fois, depuis la racine cliente.
 *
 * Sans clé configurée, la fonction ne fait rien : un développement ou une
 * préproduction non instrumentée doit fonctionner sans erreur ni requête.
 */
export function startAnalytics(locale: string): void {
  const site = siteId();
  if (!site || ready) return;

  sarutobi.init({
    siteId: site,
    ...(process.env.NEXT_PUBLIC_SARUTOBI_HOST?.trim()
      ? { host: process.env.NEXT_PUBLIC_SARUTOBI_HOST.trim() }
      : {}),
    // Consentement automatique : la collecte démarre dès la première visite,
    // sans bandeau. C'est un choix du projet, pas un défaut hérité — le SDK
    // reste en `pending` et ne collecte rien sans cette ligne.
    //
    // Un refus déjà enregistré l'emporte : le SDK relit l'état stocké avant
    // d'appliquer ce défaut, donc `refuserAnalytics()` est un opt-out durable
    // et non un réglage écrasé au rechargement suivant.
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
 * La signature évite de réémettre `$identify` à chaque rendu : le composant qui
 * appelle réagit à une session NextAuth, dont l'objet change plus souvent que
 * le contenu.
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
 * Le consentement vit dans le stockage local, hors de React. `useSyncExternalStore`
 * sait lire ce genre de source sans désaccord entre serveur et client, mais il
 * lui faut de quoi s'abonner — le SDK n'émet rien, donc on prévient nous-mêmes
 * depuis les deux seules fonctions qui changent l'état.
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
 * Il ne peut pas savoir — le choix est dans le navigateur. Ce que voit
 * l'utilisateur d'un instant d'hydratation n'est donc pas fiable, et c'est
 * pour ça que la bascule affiche un libellé d'attente au lieu de cet état.
 */
export function isAnalyticsOptedOutOnServer(): boolean {
  return false;
}
