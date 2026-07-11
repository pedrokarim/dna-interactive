# Refonte layout — suivi des conversions

> Suivi au fil de l'eau de la migration des pages vers le nouveau layout hub
> (`AppShell` + gabarit pleine largeur, plus de contenu centré, aucune pub).
> Cadre & décisions : `docs/refonte-placements-listes.md` + mémoire projet
> `project_dashboard_layout_refonte`.
>
> Légende statut : ✅ fait · 🔜 en cours · ⏳ à faire · ➖ inchangé (volontaire)

## Socle
- ✅ `AppShell` — sidebar persistante repliable + topbar + footer (`src/components/site/AppShell.tsx`)
- 🔜 `ListPageShell` — gabarit page liste (en-tête eyebrow + titre + compteur équerres, recherche, filtres, grille)

## Pages

| Page | Route | Statut | Notes |
|---|---|---|---|
| Home hub | `/` | ✅ | **Go-live** : bascule faite (`home-poc` → `/`, indexée, metadata `home`). Client `src/components/home/HomeHubClient.tsx`, données réelles. Route `/home-poc` supprimée. Sections : Hero, Base de données, Outils, Communauté, Codes cadeaux, Calendrier (démo), carrousel Builds, stats. |
| Home marketing | `/features` | ✅ | Ancienne home déplacée telle quelle (garde son chrome landing `SiteHeader`/`HeroSection`), metadata dédiée `pageMetadata.features`. Liée depuis la sidebar (« Fonctionnalités »). |
| Carte interactive | `/map` | ➖ | Ne bouge quasi pas (volontaire). |
| Personnages (liste) | `/characters` | ✅ | **Pilote** du gabarit liste. `characters/layout.tsx` → `AppShell` pleine largeur ; en-tête reskiné (eyebrow mono + titre + compteur équerres) ; logique filtres/grille inchangée ; grille simplifiée → 6 col en 2xl. |
| Personnage (fiche) | `/characters/[id]` | ✅ | Hérite `AppShell` du layout ; rend en pleine largeur (compteur `#id`, panneau stats). Aucun `<main>` propre → pas de conflit. |
| Base de données (hub) | `/items` | ✅ | `items/layout.tsx` → `AppShell` (breadcrumb `//GEAR.DATABASE`) ; en-tête gabarit + compteur catégories en équerres ; grille catégories 4 col en 2xl. |
| Items (catégorie) | `/items/[category]` | ✅ | `ItemsGridClient` : en-tête reskiné en gabarit + compteur en équerres ; logique filtres/tri/pagination inchangée. |
| Item (fiche) | `/items/[category]/[itemId]` | ✅ | Hérite `AppShell` ; rend en pleine largeur (compteur `#id`, stats, build DW). |
| Guide catégorie | `/items/[category]/about` | ✅ | Hérite `AppShell`. Pas de `<main>` propre. |
| Plans de forge | `/items/drafts` (+ `[draftId]`) | ✅ | Hérite `AppShell`. |
| Favoris | `/items/favoris` | ✅ | Hérite `AppShell` ; `ItemsGridClient` (en-tête déjà en gabarit). |
| Builder | `/builder` | ✅ | `page.tsx` → `AppShell` (//BUILD.FORGE), pleine largeur. |
| Builds communauté | `/builds` | ✅ | `page.tsx` → `AppShell` (//SHARED.LOADOUTS), pleine largeur. En-tête `DnaSectionLabel` conservé (à harmoniser en gabarit plus tard). |
| Build (fiche) | `/builds/[id]` | ✅ | `page.tsx` → `AppShell` (//SHARED.LOADOUTS), pleine largeur. |
| Commissions | `/commissions` | ✅ | `page.tsx` → `AppShell` (//COVERT.OPS.LIVE), pleine largeur. |
| Codes | `/codes` | ✅ | `page.tsx` → `AppShell` (//REDEEM.CODES), pleine largeur. |
| Changelog | `/changelog` | ✅ | `changelog/layout.tsx` → `AppShell` (//PATCH.NOTES). Contenu centré lisible conservé. |
| À propos | `/about` | ✅ | `page.tsx` → `AppShell` (//ABOUT.PROJECT). |
| Support | `/support` | ✅ | `page.tsx` → `AppShell` (//SUPPORT.DESK). |
| Contact | `/contact` | ✅ | `contact/layout.tsx` → `AppShell` (//CONTACT.CHANNEL). |
| Profil | `/profile` | ✅ | `page.tsx` → `AppShell` (//ACCOUNT.PROFILE). |
| Admin | `/admin` | ➖ | Back-office gated (404 pour non-admin), chrome propre `AdminDashboardClient` — laissé standalone comme la carte (hors nav publique). À basculer si souhaité. |
| Confidentialité | `/confidentialite` | ✅ | `page.tsx` → `AppShell` (//PRIVACY.POLICY). |

## Systèmes fonctionnels à câbler (front prêt, backend plus tard)

Le layout hub introduit des éléments qui deviendront **réellement fonctionnels** une fois
adossés au système de connexion (auth Discord déjà en place, cf. builder communautaire).
État actuel = placeholders visuels ; voici comment ils seront dégroupés/câblés.

### 1. Système de notifications (cloche topbar)
- **UI** : cloche dans le header `AppShell` + `DnaNotifDot` (point) → au clic, ouvre un
  **panneau déroulant** de notifications (liste scrollable, groupées par date, état lu/non-lu,
  bouton « tout marquer lu »).
- **Données** (backend à venir) : table `notifications` par utilisateur —
  `{ id, userId, type, payload, readAt, createdAt }`.
  Types envisagés : `new_content` (perso/arme/patch ajouté), `build_vote` /
  `build_comment` (interactions sur mes builds), `build_moderated` (build masqué/rétabli),
  `report_new` (signalement — admins), `code_added` (nouveau code de rédemption),
  `system` (annonces).
- **EXCLU volontairement** : rotation des **Commissions** (`commission_snapshots`
  change toutes les heures → spam de tout le monde). Ne PAS en faire une notification,
  même en opt-in (décision Karim, 11/07/2026). Idem pour le `event_start` du calendrier
  tant qu'il est en données de démo.
- **Compteur** : nombre de non-lues → badge chiffré sur la cloche (remplace le point statique).
- **Flux** : v1 = polling `GET /api/notifications` au chargement + à intervalle ; v2 = SSE/WebSocket.
  Marquage lu : `POST /api/notifications/read`. Rien n'est envoyé au client sans session.
- **✅ v1 implémentée (dérivée, sans table)** : `src/lib/notifications/derive.ts`
  `getNotifications(user)` dérive des tables existantes → **likes reçus sur mes builds**,
  **modération de mes builds** (`adminActions`), **signalements ouverts** (admins).
  API `GET /api/notifications`. Cloche `src/components/notifications/NotificationBell.tsx`
  (dropdown, badge non-lu, « tout marquer lu ») dans l'`AppShell`. **Lu/non-lu via
  localStorage** (`dna:notif-last-seen`), pas de colonne DB.
- **v2** : `new_content` / `code_added` (diffusion), `build_comment` (nécessite le
  système de commentaires), notif de **montée de niveau**, et un vrai ledger/table +
  état lu serveur si on veut du multi-appareil. Commissions restent **exclues** (spam horaire).

### 2. Niveau / XP utilisateur — ✅ v1 (XP dérivée, sans migration DB)
- **Lib pure** `src/lib/leveling/index.ts` : barèmes (build +40, like +8, vote donné +2,
  paliers de vues), courbe (XP n→n+1 = 100·n), titres (Éclaireur→Voyageur→…→Abyssonaute),
  `levelProgress(xp)`.
- **Serveur** `src/lib/leveling/user.ts` `getUserProgress(userId)` : XP **dérivée des
  données existantes** (builds publiés + likes reçus + vues + votes donnés) → aucune table
  ni backfill, toujours cohérent. Exposé via `GET /api/account/level`.
- **Affichage** : profil sidebar = `Lv.N · Titre` + **barre de progression** (fetch client) ;
  page `/profile` = bandeau niveau + XP + progression + breakdown (tooltip).
- **v2 possible** : sources temporelles (connexion/série), contributions carte (nouvelle
  infra), ledger `xp_events` si on veut un historique/anti-abus fin. Récompenses restent
  cosmétiques (titres).

### 3. Profil / compte — ✅ CÂBLÉ (session Discord)
- `SessionProvider` (next-auth v5) dans `Providers`. Widget client
  `src/components/auth/AccountControls.tsx` : `TopbarAccount` (avatar + dropdown
  Profil / Admin / Déconnexion, ou bouton « Se connecter ») et `SidebarProfile`
  (identité réelle + actions, état « Invité » + login si déconnecté ; avatar → /profile en replié).
  Intégrés dans `AppShell` (plus de faux « pedrokarim » / « K »).
- Reste seulement : le **niveau** (§2) et les **notifications** (§1).

## Journal
- 2026-07-11 — Socle `AppShell` posé (sidebar persistante). Home hub `home-poc` enrichie (images/dégradés). Doc de suivi créé.
- 2026-07-11 — `/characters` converti (pilote) : layout → `AppShell`, en-tête gabarit, pleine largeur, mobile OK. Chrome hérité sur la fiche.
- 2026-07-11 — `AppShell` : toggle collapse **déplacé dans le header** (fonctionnel), retiré de la sidebar ; niveau `Lv.42`→`Lv.XX` ; « Contribuer » → **Twitter/X** (`x.com/ascencia64`). Systèmes notifications/niveau/profil documentés (à câbler post-auth).
- 2026-07-11 — Home hub enrichie sur la base de la réf **complète** (capturée via scroller interne 5116px) : ajout Codes cadeaux (copier), Calendrier des événements (Gantt placeholder), carrousel Builds de personnages, section Communauté. Données de démo à brancher (codes → `/codes`, builds → `/builds`, calendrier → données jeu).
- 2026-07-11 — `/items` (hub) + `/items/[category]` convertis : `items/layout.tsx` → `AppShell`, en-têtes en gabarit + compteurs en équerres, pleine largeur. Sous-pages items héritent du chrome.
- 2026-07-11 — `/builds`, `/codes`, `/commissions` convertis : SiteHeader/SiteFooter → `AppShell`, pleine largeur (chrome par `page.tsx`).
- 2026-07-11 — Pages contenu converties : `/changelog`, `/contact` (via layout), `/about`, `/support`, `/profile`, `/confidentialite` (via page.tsx) → `AppShell`. Largeur de lecture conservée (texte).
- 2026-07-11 — `/builder` + `/builds/[id]` convertis. Fiches détail (`characters/[id]`, `items/.../[itemId]`, `about`, `drafts`, `favoris`) vérifiées : héritent du shell, rendent en pleine largeur, aucun `<main>` imbriqué. `admin` laissé standalone. **Refonte layout : terminée** (hors home marketing `/` et carte, volontaires).
- 2026-07-11 — **Go-live bascule home** : `home-poc` → `/` (hub, indexée, metadata `home`, client déplacé en `src/components/home/HomeHubClient.tsx`) ; ancienne home → `/features` (landing marketing, chrome propre, metadata `features`) ; `/home-poc` supprimée ; sidebar « Accueil » → `/`, ajout « Fonctionnalités » → `/features`.
- 2026-07-11 — **Calendrier des événements câblé sur de vrais événements** (patch 1.4, fenêtre juillet 2026) : `src/lib/events/calendar.ts` (données curées, positions déterministes, repère « aujourd'hui »), Gantt 1-événement/ligne dans la home. Aucune source tierce créditée dans le front (à rafraîchir à chaque version du jeu).
- 2026-07-11 — Home hub **câblée sur les vraies données** : `home-poc/page.tsx` (server, `force-dynamic`) → codes réels (`GAME_CODES`), top builds + total (DB via `src/lib/community-builds/list.ts` `getTopBuilds`/`getBuildsTotal`, sûrs si table absente), compteurs personnages/items réels, portraits perso réels dans le carrousel, format nombres selon la locale. Restent en placeholder : **calendrier** (pas de source jeu, labellisé démo) et profil/notifications (auth, cf. « Systèmes à câbler »). Admin : rien à faire (dashboard propre).

## Méthode de conversion (recette réutilisable)
1. Le chrome vient soit d'un `<section>/layout.tsx` local, soit de `SiteHeader`/`SiteFooter` dans la `page.tsx`. Repérer lequel.
2. Remplacer par `AppShell` (breadcrumb `//X.DATABASE`) + wrapper pleine largeur `mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8`. Retirer le `container mx-auto` centré.
3. Reskiner l'en-tête en gabarit : eyebrow `font-mono` `// LABEL`, titre `font-display` XL, soulignement `bg-gold`, compteur en `DnaCornerBrackets` haut-droite. Ne PAS toucher la logique (filtres, tri, pagination, data).
4. Élargir les grilles (`2xl:grid-cols-*`) pour exploiter l'espace.
5. i18n : réutiliser les clés existantes, ne pas coder de FR en dur.
